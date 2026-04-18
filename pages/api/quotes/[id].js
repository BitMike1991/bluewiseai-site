// pages/api/quotes/[id].js
// PATCH /api/quotes/:id — multi-tenant safe quote update
import { getAuthContext } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: 'PATCH only' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing quote id' });

  try {
    // Verify quote belongs to this customer (multi-tenant safety)
    const { data: existing, error: fetchErr } = await supabase
      .from('quotes')
      .select('id, customer_id, job_id, subtotal, line_items')
      .eq('id', id)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const {
      line_items,
      subtotal,
      tax_gst,
      tax_qst,
      total_ttc,
      notes,
      valid_until,
      status,
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };

    // Never allow changing customer_id or job_id
    if (line_items !== undefined) updates.line_items = line_items;
    if (notes !== undefined) updates.notes = notes;
    if (valid_until !== undefined) updates.valid_until = valid_until;
    if (status !== undefined) updates.status = status;

    // Recompute totals from line_items if not explicitly provided
    if (line_items !== undefined) {
      const computedSubtotal = (line_items || []).reduce(
        (s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
        0
      );
      updates.subtotal = subtotal !== undefined ? Number(subtotal) : computedSubtotal;
      updates.tax_gst  = tax_gst   !== undefined ? Number(tax_gst)   : updates.subtotal * 0.05;
      updates.tax_qst  = tax_qst   !== undefined ? Number(tax_qst)   : updates.subtotal * 0.09975;
      updates.total_ttc = total_ttc !== undefined
        ? Number(total_ttc)
        : updates.subtotal + updates.tax_gst + updates.tax_qst;
    } else {
      // If only totals provided (no items)
      if (subtotal   !== undefined) updates.subtotal   = Number(subtotal);
      if (tax_gst    !== undefined) updates.tax_gst    = Number(tax_gst);
      if (tax_qst    !== undefined) updates.tax_qst    = Number(tax_qst);
      if (total_ttc  !== undefined) updates.total_ttc  = Number(total_ttc);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (updateErr) {
      console.error('[api/quotes/[id]] updateErr', updateErr);
      return res.status(500).json({ error: 'Failed to update quote' });
    }

    // Log quote_edited event
    try {
      await supabase.from('job_events').insert({
        job_id:      existing.job_id,
        customer_id: customerId,
        event_type:  'quote_edited',
        payload:     { quote_id: id, updated_fields: Object.keys(updates).filter(k => k !== 'updated_at') },
        created_at:  new Date().toISOString(),
      });
    } catch (evErr) {
      console.error('[api/quotes/[id]] event log failed (non-fatal):', evErr);
    }

    return res.status(200).json({ success: true, quote: updated });
  } catch (err) {
    console.error('[api/quotes/[id]] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
