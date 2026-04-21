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

  // Always bypass browser + Vercel edge cache — the rerender pipeline below
  // reads current line_items / config / template every time, so a cached
  // JSON response would defeat the point.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

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

    // ALWAYS re-render with the latest template + current line_items. If
    // anything goes wrong, surface the error in the HTML itself so we never
    // silently revert to the stale snapshot (Mikael 2026-04-21: "marche
    // pas calisse les specs apparaisse pas").
    let renderTrace = { step: 'init' };
    try {
      renderTrace.step = 'assemble';
      const { projects, totalItems, totalQty } = await assembleProjectsFromItemRefs(
        supabase, customerId, bc.item_refs || []
      );
      renderTrace.projects_count = projects.length;
      renderTrace.total_items = totalItems;

      renderTrace.step = 'tenant';
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

      renderTrace.step = 'build';
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

      // Inject a marker comment so we can SEE in DevTools that this rendered
      // copy came from the server-side rerender path (not the stored snapshot
      // and not a service-worker cached response).
      const stamped = fresh.replace(
        '<head>',
        `<head><!-- BC_RENDERER=fresh build=${Date.now()} projects=${projects.length} items=${totalItems} -->`
      );

      return res.status(200).json({
        bc: { ...bc, html_content: stamped },
        html_source: 'rerendered',
        debug: renderTrace,
      });
    } catch (rerErr) {
      console.error('[bc/[id]] rerender FAILED at step', renderTrace.step, '-', rerErr?.message, rerErr?.stack);
      // Surface the error visibly instead of falling back to stale snapshot.
      const errHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><!-- BC_RENDERER=ERROR step=${renderTrace.step} --></head><body style="font-family:sans-serif;padding:40px;background:#fff8f8;color:#7a1a1a;">
<h1>Erreur de rendu BDC</h1>
<p><strong>Étape :</strong> ${renderTrace.step}</p>
<p><strong>Erreur :</strong> ${String(rerErr?.message || rerErr).replace(/[<>&]/g, '?')}</p>
<p>Trace : ${JSON.stringify(renderTrace).replace(/[<>&]/g, '?')}</p>
<p>Le BDC stocké est intact ; visiter <code>?cached=1</code> pour voir le snapshot original.</p>
</body></html>`;
      return res.status(200).json({
        bc: { ...bc, html_content: errHtml },
        html_source: 'render_error',
        debug: renderTrace,
        error_message: rerErr?.message,
      });
    }
  } catch (err) {
    console.error('[bc/[id]] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
