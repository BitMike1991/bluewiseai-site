// pages/api/bons-de-commande/[id]/index.js
// GET /api/bons-de-commande/:id?cached=0|1
//   - cached=0 (default): re-renders the BC HTML on the fly using the latest
//     template + CURRENT quote line_items, so old BDCs always pick up the
//     newest layout / spec sanitizers. Mikael 2026-04-21:
//     "ca ne backlog pas sur les ancien BC".
//   - cached=1: returns the snapshot that was stored at generate-time
//     (kept for legal/audit trail of the doc actually sent).
// Multi-tenant: verified against session customer_id.

import { getAuthContext } from '../../../../lib/supabaseServer';
import {
  buildBcHtml,
  assembleProjectsFromItemRefs,
} from '../../../../lib/bons-de-commande/template.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'GET only' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const { id, cached } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const { data: bc, error } = await supabase
      .from('bons_de_commande')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (error || !bc) return res.status(404).json({ error: 'BC not found' });

    // ?cached=1 → return the snapshot stored at generation (legal audit copy).
    if (cached === '1' || cached === 'true') {
      return res.status(200).json({ bc, html_source: 'snapshot' });
    }

    // Default: re-render with the latest template using the current line_items.
    // If anything fails (missing quote, deleted job, etc), fall back to the
    // stored snapshot so the viewer never breaks.
    try {
      const { projects, totalItems, totalQty } = await assembleProjectsFromItemRefs(
        supabase, customerId, bc.item_refs || []
      );
      if (projects.length > 0) {
        const { data: tenant } = await supabase
          .from('customers')
          .select('business_name, quote_config')
          .eq('id', customerId)
          .maybeSingle();
        const cfg = tenant?.quote_config || {};
        const businessName  = cfg.branding?.business_name || tenant?.business_name || 'Entreprise';
        const authorizedRep = cfg.contract?.authorized_rep
          || cfg.email_signature?.name
          || null;
        const fresh = buildBcHtml({
          bc_number: bc.bc_number,
          supplier: bc.supplier,
          date: bc.created_at || new Date().toISOString(),
          projects,
          totalItems,
          totalQty,
          businessName,
          authorizedRep,
          hideSupplierName: true,
        });
        return res.status(200).json({
          bc: { ...bc, html_content: fresh },
          html_source: 'rerendered',
        });
      }
    } catch (rerErr) {
      console.warn('[bc/[id]] rerender failed, falling back to snapshot:', rerErr?.message);
    }

    return res.status(200).json({ bc, html_source: 'snapshot_fallback' });
  } catch (err) {
    console.error('[bc/[id]] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
