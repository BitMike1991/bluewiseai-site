// pages/api/employees/[id].js
// Update or archive one employee. Never hard-delete — we need the history
// for prior time_entries to remain joinable.
//
// PATCH → update fields
// DELETE → set status='inactive' + end_date=today

import { getAuthContext } from '../../../lib/supabaseServer';
import { encryptSin, isValidSinFormat } from '../../../lib/payroll/sin-crypto';

const PATCHABLE = new Set([
  'first_name', 'last_name', 'role', 'hourly_rate', 'status',
  'phone', 'email', 'hire_date', 'end_date', 'notes',
  'td1_federal', 'tp1015_qc', 'sin_encrypted',
]);

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { data: existing } = await supabase
    .from('employees')
    .select('id, customer_id')
    .eq('id', id)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Employee not found' });

  if (req.method === 'PATCH') {
    const patch = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (PATCHABLE.has(k)) patch[k] = v;
    }
    // sin_plain → encrypted (never stored as plaintext)
    const rawSin = req.body?.sin_plain;
    if (rawSin) {
      if (!isValidSinFormat(rawSin)) {
        return res.status(400).json({ error: 'NAS invalide (doit avoir 9 chiffres + passer la validation Luhn)' });
      }
      try {
        patch.sin_encrypted = encryptSin(rawSin);
      } catch (e) {
        console.error('[api/employees] SIN encryption failed', e.message);
        return res.status(500).json({ error: 'Échec du chiffrement NAS (vérifier PAYROLL_SIN_KEY env var)' });
      }
    }
    if (patch.hourly_rate != null) {
      const n = Number(patch.hourly_rate);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: 'hourly_rate invalid' });
      patch.hourly_rate = Math.round(n * 100) / 100;
    }
    if (patch.status && !['active', 'inactive'].includes(patch.status)) {
      return res.status(400).json({ error: 'status must be active or inactive' });
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No patchable fields' });
    }
    const { data, error } = await supabase
      .from('employees')
      .update(patch)
      .eq('id', id)
      .eq('customer_id', customerId)
      .select('id, first_name, last_name, full_name, role, hourly_rate, status, phone, email, hire_date, end_date, notes')
      .single();
    if (error) {
      console.error('[api/employees/:id] patch error', error);
      return res.status(500).json({ error: 'Update failed', details: error.message });
    }
    return res.status(200).json({ success: true, employee: data });
  }

  if (req.method === 'DELETE') {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('employees')
      .update({ status: 'inactive', end_date: today })
      .eq('id', id)
      .eq('customer_id', customerId);
    if (error) {
      console.error('[api/employees/:id] archive error', error);
      return res.status(500).json({ error: 'Archive failed' });
    }
    return res.status(200).json({ success: true, archived: true });
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
