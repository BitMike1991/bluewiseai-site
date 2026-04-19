// pages/api/employees/index.js
// Employee roster for the current tenant.
//
// GET  → { employees: [...] }  (status=active by default, pass ?status=all for archived)
// POST → create employee
//
// F-P9 MVP: name, role, hourly_rate, status, contact. DAS fields (SIN,
// TD1, TP-1015) are stored but unused until F-P10 ships the calc.

import { getAuthContext } from '../../../lib/supabaseServer';
import { encryptSin, isValidSinFormat } from '../../../lib/payroll/sin-crypto';

const ALLOWED_STATUS = new Set(['active', 'inactive']);

export default async function handler(req, res) {
  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  if (req.method === 'GET') {
    const statusFilter = String(req.query.status || 'active').toLowerCase();
    let q = supabase
      .from('employees')
      .select('id, first_name, last_name, full_name, role, hourly_rate, status, phone, email, hire_date, end_date, notes, created_at')
      .eq('customer_id', customerId)
      .order('status', { ascending: true })
      .order('full_name', { ascending: true });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, error } = await q;
    if (error) {
      console.error('[api/employees] list error', error);
      return res.status(500).json({ error: 'Failed to load employees' });
    }
    return res.status(200).json({ employees: data || [] });
  }

  if (req.method === 'POST') {
    const {
      first_name, last_name,
      role, hourly_rate, status,
      phone, email, hire_date, notes,
      td1_federal, tp1015_qc,
      sin_plain,
    } = req.body || {};
    // sin_encrypted is NEVER accepted from client — raw ciphertext bypasses
    // Luhn validation and could let the caller shove any string into the
    // column. Clients send sin_plain → server encrypts.

    if (!first_name || !String(first_name).trim()) {
      return res.status(400).json({ error: 'first_name is required' });
    }
    const rateNum = Number(hourly_rate);
    if (!Number.isFinite(rateNum) || rateNum < 0) {
      return res.status(400).json({ error: 'hourly_rate must be a non-negative number' });
    }
    const statusNorm = status ? String(status).toLowerCase() : 'active';
    if (!ALLOWED_STATUS.has(statusNorm)) {
      return res.status(400).json({ error: 'status must be active or inactive' });
    }

    const row = {
      customer_id: customerId,
      first_name: String(first_name).trim(),
      last_name:  last_name ? String(last_name).trim() : null,
      role:       role ? String(role).trim() : null,
      hourly_rate: Math.round(rateNum * 100) / 100,
      status:     statusNorm,
      phone:      phone || null,
      email:      email || null,
      hire_date:  hire_date || null,
      notes:      notes || null,
      td1_federal: td1_federal != null ? Number(td1_federal) : null,
      tp1015_qc:   tp1015_qc   != null ? Number(tp1015_qc)   : null,
      sin_encrypted: null,
    };

    if (sin_plain) {
      if (!isValidSinFormat(sin_plain)) {
        return res.status(400).json({ error: 'NAS invalide (9 chiffres + Luhn)' });
      }
      try {
        row.sin_encrypted = encryptSin(sin_plain);
      } catch (e) {
        console.error('[api/employees] SIN encryption failed', e.message);
        return res.status(500).json({ error: 'Échec du chiffrement NAS (vérifier PAYROLL_SIN_KEY)' });
      }
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(row)
      .select('id, first_name, last_name, full_name, role, hourly_rate, status')
      .single();

    if (error) {
      console.error('[api/employees] insert error', error);
      return res.status(500).json({ error: 'Failed to create employee', details: error.message });
    }

    return res.status(201).json({ success: true, employee: data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
