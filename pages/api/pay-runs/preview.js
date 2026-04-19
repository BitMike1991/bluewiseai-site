// pages/api/pay-runs/preview.js
// Compute a DAS preview for a date range, per employee. Does NOT mutate
// any rows — Jer sees breakdown first, then hits Confirmer which calls
// /api/pay-runs/commit.
//
// POST body: {
//   from:   'YYYY-MM-DD',
//   to:     'YYYY-MM-DD',
//   employee_ids?: ['uuid', ...]  // omit = all active
//   pay_period?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' (default biweekly)
// }
//
// Returns: {
//   period: { from, to, pay_period, pay_periods_per_year },
//   rows: [{ employee_id, employee_name, entry_ids[], hours, gross, ytd_gross_before, das: {...}, net }],
//   totals: { gross, deductions, net, employer, total_cost, entry_count }
// }

import { getAuthContext } from '../../../lib/supabaseServer';
import { computeDas, PAY_PERIODS_PER_YEAR, RATES_2026 } from '../../../lib/payroll/das';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { from, to, employee_ids, pay_period = 'biweekly' } = req.body || {};
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({ error: 'from/to must be YYYY-MM-DD' });
  }
  if (from > to) return res.status(400).json({ error: 'from must be ≤ to' });

  const ppy = PAY_PERIODS_PER_YEAR[pay_period];
  if (!ppy) return res.status(400).json({ error: 'invalid pay_period' });

  const year = Number(from.slice(0, 4));
  const yearStart = `${year}-01-01`;

  // Load entries for the period (not yet paid)
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
    return res.status(200).json({
      period: { from, to, pay_period, pay_periods_per_year: ppy, year },
      rows: [],
      totals: zeroTotals(),
      rates_note: RATES_2026.source_note,
    });
  }

  // Group entries per employee
  const groups = new Map(); // employee_id → { entry_ids, hours, gross }
  for (const e of entries) {
    const g = groups.get(e.employee_id) || { entry_ids: [], hours: 0, gross: 0 };
    g.entry_ids.push(e.id);
    g.hours += Number(e.hours || 0);
    g.gross += Number(e.gross || 0);
    groups.set(e.employee_id, g);
  }

  const employeeIds = [...groups.keys()];

  // Load employee metadata
  const { data: empRows, error: empErr } = await supabase
    .from('employees')
    .select('id, full_name, hourly_rate, td1_federal, tp1015_qc')
    .eq('customer_id', customerId)
    .in('id', employeeIds);
  if (empErr) return res.status(500).json({ error: empErr.message });
  const empById = new Map((empRows || []).map((e) => [e.id, e]));

  // YTD gross BEFORE this period (for RRQ/EI/RQAP caps)
  const { data: ytdRows, error: ytdErr } = await supabase
    .from('time_entries')
    .select('employee_id, gross, paid_at, work_date')
    .eq('customer_id', customerId)
    .in('employee_id', employeeIds)
    .gte('work_date', yearStart)
    .lt('work_date', from);
  if (ytdErr) return res.status(500).json({ error: ytdErr.message });
  const ytdByEmp = new Map();
  for (const r of ytdRows || []) {
    ytdByEmp.set(r.employee_id, (ytdByEmp.get(r.employee_id) || 0) + Number(r.gross || 0));
  }

  // CNESST rate (tenant override or default)
  const { data: custRow } = await supabase
    .from('customers')
    .select('cnesst_rate')
    .eq('id', customerId)
    .maybeSingle();
  const cnesstRate = Number.isFinite(Number(custRow?.cnesst_rate))
    ? Number(custRow.cnesst_rate)
    : RATES_2026.cnesst.default_rate;

  // Compute per employee
  const rows = [];
  const totals = zeroTotals();

  for (const [empId, grp] of groups.entries()) {
    const emp = empById.get(empId);
    if (!emp) continue;
    const ytd = ytdByEmp.get(empId) || 0;

    const das = computeDas({
      gross: grp.gross,
      ytdGross: ytd,
      payPeriodsPerYear: ppy,
      td1Federal: emp.td1_federal != null ? Number(emp.td1_federal) : undefined,
      tp1015Quebec: emp.tp1015_qc != null ? Number(emp.tp1015_qc) : undefined,
      cnesstRate,
    });

    rows.push({
      employee_id: empId,
      employee_name: emp.full_name,
      entry_ids: grp.entry_ids,
      entry_count: grp.entry_ids.length,
      hours: Math.round(grp.hours * 100) / 100,
      gross: das.gross,
      ytd_gross_before: Math.round(ytd * 100) / 100,
      deductions: das.deductions,
      net_pay: das.net_pay,
      employer: das.employer,
      total_cost: das.total_cost,
    });

    totals.gross += das.gross;
    totals.deductions.rrq += das.deductions.rrq;
    totals.deductions.ei  += das.deductions.ei;
    totals.deductions.rqap += das.deductions.rqap;
    totals.deductions.federal_tax += das.deductions.federal_tax;
    totals.deductions.qc_tax      += das.deductions.qc_tax;
    totals.deductions.total += das.deductions.total;
    totals.net_pay += das.net_pay;
    totals.employer.rrq += das.employer.rrq;
    totals.employer.ei  += das.employer.ei;
    totals.employer.rqap += das.employer.rqap;
    totals.employer.cnesst += das.employer.cnesst;
    totals.employer.total  += das.employer.total;
    totals.total_cost += das.total_cost;
    totals.entry_count += grp.entry_ids.length;
  }

  // Round totals
  roundObjMoney(totals);

  return res.status(200).json({
    period: { from, to, pay_period, pay_periods_per_year: ppy, year },
    rows,
    totals,
    rates_note: RATES_2026.source_note,
  });
}

function zeroTotals() {
  return {
    gross: 0,
    deductions: { rrq: 0, ei: 0, rqap: 0, federal_tax: 0, qc_tax: 0, total: 0 },
    net_pay: 0,
    employer: { rrq: 0, ei: 0, rqap: 0, cnesst: 0, total: 0 },
    total_cost: 0,
    entry_count: 0,
  };
}

function roundObjMoney(obj) {
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'number') {
      obj[k] = Math.round(obj[k] * 100) / 100;
    } else if (obj[k] && typeof obj[k] === 'object') {
      roundObjMoney(obj[k]);
    }
  }
}
