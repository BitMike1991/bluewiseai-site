// pages/api/bons-de-commande/[id]/send.js
// POST /api/bons-de-commande/:id/send
// Body: { supplier_email: string, subject?: string, message?: string }
// Sends BC HTML to supplier via Gmail OAuth (preferred) or Mailgun fallback.
// Updates BC status='sent', sent_at=now().
// Updates all items: _bc_sent_at=timestamp (removes from pending list).
// Inserts job_events for each affected job.
// Multi-tenant: BC must belong to session customer_id.

import { getAuthContext } from '../../../../lib/supabaseServer';
import { sendEmailGmail } from '../../../../lib/providers/gmail';
import { sendEmailMailgun } from '../../../../lib/providers/mailgun';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'POST only' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { id } = req.query;
  const { supplier_email, subject, message } = req.body || {};

  if (!id) return res.status(400).json({ error: 'Missing BC id' });
  if (!supplier_email || !supplier_email.includes('@')) {
    return res.status(400).json({ error: 'supplier_email is required and must be valid' });
  }

  try {
    // Load BC — verify customer_id tenant isolation
    const { data: bc, error: bcErr } = await supabase
      .from('bons_de_commande')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (bcErr || !bc) {
      return res.status(404).json({ error: 'Bon de commande not found' });
    }
    if (bc.status === 'sent') {
      return res.status(409).json({ error: 'Already sent', bc_number: bc.bc_number, sent_at: bc.sent_at });
    }

    const emailSubject = subject || `Bon de commande ${bc.bc_number} — PÜR Construction`;
    const emailBody = message ||
      `Bonjour,\n\nVeuillez trouver ci-joint le bon de commande ${bc.bc_number} de PÜR Construction & Rénovation Inc.\n\nCordialement,\nJérémy Caron\nPÜR Construction & Rénovation\n`;

    // Try Gmail OAuth first (customer's connected Gmail account)
    let sendResult = { success: false, error: 'No send method available' };

    const { data: oauthRow } = await supabase
      .from('customer_email_oauth')
      .select('*')
      .eq('customer_id', customerId)
      .eq('provider', 'google')
      .maybeSingle();

    if (oauthRow) {
      sendResult = await sendEmailGmail(
        {
          to:      supplier_email,
          subject: emailSubject,
          body:    emailBody,
          html:    bc.html_content,
        },
        oauthRow,
        async (newAccessToken, newExpiry) => {
          await supabase
            .from('customer_email_oauth')
            .update({ access_token: newAccessToken, token_expiry: newExpiry })
            .eq('id', oauthRow.id);
        }
      );
    }

    // Mailgun fallback
    if (!sendResult.success) {
      const { data: branding } = await supabase
        .from('customers')
        .select('onboarding_intake')
        .eq('id', customerId)
        .maybeSingle();

      const mailgunResult = await sendEmailMailgun({
        to:      supplier_email,
        subject: emailSubject,
        text:    emailBody,
        html:    bc.html_content,
      });
      sendResult = mailgunResult;
    }

    if (!sendResult.success) {
      console.error('[bc/send] send failed:', sendResult.error);
      return res.status(502).json({ error: `Email send failed: ${sendResult.error}` });
    }

    const sentAt = new Date().toISOString();

    // Update BC: status=sent, sent_at
    await supabase
      .from('bons_de_commande')
      .update({ status: 'sent', sent_at: sentAt, updated_at: sentAt })
      .eq('id', id)
      .eq('customer_id', customerId);

    // Update items in quotes: _bc_sent_at on each referenced item
    const itemRefs = Array.isArray(bc.item_refs) ? bc.item_refs : [];
    const byQuote = {};
    for (const ref of itemRefs) {
      if (!byQuote[ref.quote_id]) byQuote[ref.quote_id] = [];
      byQuote[ref.quote_id].push(ref.item_index);
    }

    // Fetch quotes and patch items
    const quoteIds = Object.keys(byQuote).map(Number);
    if (quoteIds.length > 0) {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, job_id, line_items')
        .in('id', quoteIds)
        .eq('customer_id', customerId);

      const patchPromises = (quotes || []).map(async (quote) => {
        const idxs = byQuote[quote.id] || [];
        const updatedItems = [...(quote.line_items || [])];
        for (const idx of idxs) {
          if (updatedItems[idx]) {
            updatedItems[idx] = {
              ...updatedItems[idx],
              _bc_sent_at: sentAt,
            };
          }
        }
        await supabase
          .from('quotes')
          .update({ line_items: updatedItems, updated_at: sentAt })
          .eq('id', quote.id)
          .eq('customer_id', customerId);
        return quote.job_id;
      });

      const jobIds = (await Promise.all(patchPromises)).filter(Boolean);

      // Log job_events for each unique job
      const uniqueJobIds = [...new Set(jobIds)];
      if (uniqueJobIds.length > 0) {
        const events = uniqueJobIds.map(jobId => ({
          job_id:      jobId,
          customer_id: customerId,
          event_type:  'bc_sent',
          payload:     {
            bc_id:          bc.id,
            bc_number:      bc.bc_number,
            supplier:       bc.supplier,
            supplier_email,
          },
          created_at: sentAt,
        }));
        await supabase.from('job_events').insert(events);
      }
    }

    return res.status(200).json({
      success: true,
      bc_number:   bc.bc_number,
      sent_at:     sentAt,
      supplier_email,
      message_id:  sendResult.provider_message_id || null,
    });
  } catch (err) {
    console.error('[bc/send] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
