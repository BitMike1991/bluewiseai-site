// pages/api/pay-runs/commit.js
// Commit a pay run — writes DAS breakdown + pay_run_id + paid_at onto each
// time_entries row. After commit, entries become immutable (delete blocked).
//
// POST body: same as preview + { confirm: true }
//
// Recomputes DAS server-side from scratch (never trusts client numbers).

import { getAuthContext } from '../../../lib/supabaseServer';
import { computeDas, PAY_PERIODS_PER_YEAR, RATES_2026 } from '../../../lib/payroll/das';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { from, to, employee_ids, pay_period = 'biweekly', confirm } = req.body || {};
  if (!confirm) return res.status(400).json({ error: 'confirm=true required' });
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  const ppy = PAY_PERIODS_PER_YEAR[pay_period];
  if (!ppy) return res.status(400).json({ error: 'invalid pay_period' });

  const year = Number(from.slice(0, 4));
  const yearStart = `${year}-01-01`;
  const payRunId = crypto.randomUUID();
  const paidAt = new Date().toISOString();

  // Re-load entries exactly the same way preview did
  let entryQ = supabase
    .from('time_entries')
    .select('id, employee_id, work_date, hours, gross, pay_run_id')
    .eq('customer_id', customerId)
    .gte('work_date', from)
    .lte('work_date', to)
    .is('pay_run_id', null);
  if (Array.isArray(employee_ids) && employee_ids.length) {
    entryQ = entryQ.in('employee_id', employee_ids);
  }
  const { data: entries, error: eErr } = await entryQ;
  if (eErr) return res.status(500).json({ error: eErr.message });
  if (!entries || entries.length === 0) {
    return res.status(400).json({ error: 'No unpaid entries in this range' });
  }

  // Group entries per employee
  const groups = new Map();
  for (const e of entries) {
    const g = groups.get(e.employee_id) || { entries: [], gross: 0 };
    g.entries.push(e);
    g.gross += Number(e.gross || 0);
    groups.set(e.employee_id, g);
  }
  const employeeIds = [...groups.keys()];

  // Employee metadata
  const { data: empRows } = await supabase
    .from('employees')
    .select('id, td1_federal, tp1015_qc')
    .eq('customer_id', customerId)
    .in('id', employeeIds);
  const empById = new Map((empRows || []).map((e) => [e.id, e]));

  // YTD
  const { data: ytdRows } = await supabase
    .from('time_entries')
    .select('employee_id, gross, work_date')
    .eq('customer_id', customerId)
    .in('employee_id', employeeIds)
    .gte('work_date', yearStart)
    .lt('work_date', from);
  const ytdByEmp = new Map();
  for (const r of ytdRows || []) {
    ytdByEmp.set(r.employee_id, (ytdByEmp.get(r.employee_id) || 0) + Number(r.gross || 0));
  }

  // CNESST rate
  const { data: custRow } = await supabase
    .from('customers')
    .select('cnesst_rate')
    .eq('id', customerId)
    .maybeSingle();
  const cnesstRate = Number.isFinite(Number(custRow?.cnesst_rate))
    ? Number(custRow.cnesst_rate)
    : RATES_2026.cnesst.default_rate;

  // Compute DAS per employee, then pro-rate back onto entries by gross share
  const updates = [];
  for (const [empId, grp] of groups.entries()) {
    const emp = empById.get(empId);
    const ytd = ytdByEmp.get(empId) || 0;
    const das = computeDas({
      gross: grp.gross,
      ytdGross: ytd,
      payPeriodsPerYear: ppy,
      td1Federal: emp?.td1_federal != null ? Number(emp.td1_federal) : undefined,
      tp1015Quebec: emp?.tp1015_qc != null ? Number(emp.tp1015_qc) : undefined,
      cnesstRate,
    });

    // Pro-rate each entry by gross share (handles multi-day pay periods)
    let runningDeductions = 0;
    let runningNet = 0;
    for (let i = 0; i < grp.entries.length; i++) {
      const e = grp.entries[i];
      const share = grp.gross > 0 ? Number(e.gross || 0) / grp.gross : 0;
      const isLast = i === grp.entries.length - 1;

      // Pro-rata each deduction; last entry absorbs rounding remainder
      const d = {
        rrq:         round2(das.deductions.rrq * share),
        ei:          round2(das.deductions.ei  * share),
        rqap:        round2(das.deductions.rqap * share),
        federal_tax: round2(das.deductions.federal_tax * share),
        qc_tax:      round2(das.deductions.qc_tax      * share),
      };
      let totalDed = d.rrq + d.ei + d.rqap + d.federal_tax + d.qc_tax;
      let net = round2(Number(e.gross || 0) - totalDed);

      if (isLast) {
        // Absorb rounding: ensure sum-of-parts == total
        const wantTotalDed = round2(das.deductions.total - runningDeductions);
        const diff = round2(wantTotalDed - totalDed);
        if (diff !== 0) {
          d.qc_tax = round2(d.qc_tax + diff);
          totalDed = round2(totalDed + diff);
          net = round2(Number(e.gross || 0) - totalDed);
        }
      }
      runningDeductions = round2(runningDeductions + totalDed);
      runningNet = round2(runningNet + net);

      updates.push({
        id: e.id,
        rrq: d.rrq,
        ei: d.ei,
        rqap: d.rqap,
        federal_tax: d.federal_tax,
        qc_tax: d.qc_tax,
        cnesst: round2((das.employer.cnesst) * share),
        net_pay: net,
        pay_run_id: payRunId,
        paid_at: paidAt,
      });
    }
  }

  // Write updates. Supabase has no batch UPDATE with different values per row,
  // so loop — small pay runs, perf is fine.
  let failed = 0;
  for (const u of updates) {
    const { id, ...fields } = u;
    const { error } = await supabase
      .from('time_entries')
      .update(fields)
      .eq('id', id)
      .eq('customer_id', customerId);
    if (error) {
      console.error('[pay-runs/commit] update error', id, error);
      failed++;
    }
  }

  return res.status(200).json({
    success: failed === 0,
    pay_run_id: payRunId,
    paid_at: paidAt,
    updated: updates.length - failed,
    failed,
  });
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}
