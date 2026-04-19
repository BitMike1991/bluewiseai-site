// pages/api/time-entries/index.js
// Time entries = daily hours logged per employee (optionally tied to a job).
//
// GET  → list entries for the tenant, filter by employee_id / job_id / date range
// POST → create entry; snapshots hourly_rate from employee; computes gross
//
// F-P9 scope: log hours → gross pay. F-P10 fills in federal_tax / qc_tax /
// rrq / rqap / ei / cnesst / net_pay via the DAS calculator.

import { getAuthContext } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  if (req.method === 'GET') {
    const { employee_id, job_id, from, to, limit = '200' } = req.query;
    let q = supabase
      .from('time_entries')
      .select(`
        id, work_date, hours, hourly_rate, gross, description, job_id, employee_id, paid_at, pay_run_id,
        federal_tax, qc_tax, rrq, rqap, ei, cnesst, net_pay,
        employees!inner ( id, full_name, role )
      `)
      .eq('customer_id', customerId)
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit) || 200, 500));
    if (employee_id) q = q.eq('employee_id', employee_id);
    if (job_id)      q = q.eq('job_id', job_id);
    if (from)        q = q.gte('work_date', from);
    if (to)          q = q.lte('work_date', to);

    const { data, error } = await q;
    if (error) {
      console.error('[api/time-entries] list error', error);
      return res.status(500).json({ error: 'Failed to load time entries' });
    }

    // Attach flat employee_name for convenience
    const entries = (data || []).map((row) => ({
      ...row,
      employee_name: row.employees?.full_name || '—',
      employee_role: row.employees?.role || null,
    }));

    // Quick rollup: total hours + total gross
    const totalHours = entries.reduce((s, e) => s + Number(e.hours || 0), 0);
    const totalGross = entries.reduce((s, e) => s + Number(e.gross || 0), 0);

    return res.status(200).json({
      entries,
      totals: {
        hours: Math.round(totalHours * 100) / 100,
        gross: Math.round(totalGross * 100) / 100,
        count: entries.length,
      },
    });
  }

  if (req.method === 'POST') {
    const {
      employee_id, job_id,
      work_date, hours,
      hourly_rate_override,
      description,
    } = req.body || {};

    if (!employee_id)        return res.status(400).json({ error: 'employee_id required' });
    if (!work_date)          return res.status(400).json({ error: 'work_date required (YYYY-MM-DD)' });
    const hoursNum = Number(hours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      return res.status(400).json({ error: 'hours must be between 0 and 24' });
    }

    // Tenant-guard employee
    const { data: emp } = await supabase
      .from('employees')
      .select('id, hourly_rate, status')
      .eq('id', employee_id)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (!emp) return res.status(404).json({ error: 'Employee not found for this tenant' });

    // Tenant-guard optional job
    if (job_id) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', job_id)
        .eq('customer_id', customerId)
        .maybeSingle();
      if (!job) return res.status(404).json({ error: 'Job not found for this tenant' });
    }

    const rate = hourly_rate_override != null
      ? Number(hourly_rate_override)
      : Number(emp.hourly_rate);
    if (!Number.isFinite(rate) || rate < 0) {
      return res.status(400).json({ error: 'hourly_rate invalid' });
    }
    const gross = Math.round(hoursNum * rate * 100) / 100;

    const row = {
      customer_id: customerId,
      employee_id,
      job_id: job_id || null,
      work_date,
      hours: Math.round(hoursNum * 100) / 100,
      hourly_rate: Math.round(rate * 100) / 100,
      gross,
      description: description || null,
    };

    const { data, error } = await supabase
      .from('time_entries')
      .insert(row)
      .select('id, work_date, hours, hourly_rate, gross, employee_id, job_id, description')
      .single();

    if (error) {
      console.error('[api/time-entries] insert error', error);
      return res.status(500).json({ error: 'Failed to create time entry', details: error.message });
    }

    return res.status(201).json({ success: true, entry: data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
