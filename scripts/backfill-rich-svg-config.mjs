#!/usr/bin/env node
/**
 * Backfill _config + _window_type on existing quote line_items using the
 * Royalty catalog. Fixes the broken SVGs on the 6 rescue quotes + any pre-hub
 * quote where line items were created via the PDF parser path (which stored
 * `type` + `model` but not the rich config).
 *
 * Matching:
 *   - Each quote.line_items[i] has `type` (e.g. "Fenêtre à battant") and
 *     `model` (e.g. "BS2", "ARC-4F", "C2G", "Odyssée 6pi PVC blanc", "PS-34").
 *   - For windows: match WINDOW_TYPES[*].name → find configuration.code === item.model
 *   - For patio doors: PATIO_DOOR_COLLECTIONS + PATIO_CONFIGS
 *   - For entry doors: ENTRY_DOOR_STYLES (from portes-standard-catalog.js)
 *
 * Dry-run by default. Pass --live to actually write.
 *
 * Usage:
 *   node scripts/backfill-rich-svg-config.mjs [--live] [--customer-id=9] [--job-id=100]
 */

import { createClient } from '@supabase/supabase-js';
import { WINDOW_TYPES, PATIO_DOOR_COLLECTIONS, PATIO_CONFIGS, ENTRY_DOOR_STYLES } from '../lib/royalty-catalog.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SRK) { console.error('SUPABASE_SERVICE_ROLE_KEY required'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SRK, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const live        = argv.includes('--live');
const custArg     = argv.find(a => a.startsWith('--customer-id='));
const jobArg      = argv.find(a => a.startsWith('--job-id='));
const customerId  = custArg ? Number(custArg.split('=')[1]) : null;
const jobId       = jobArg  ? Number(jobArg.split('=')[1]) : null;

// Build a fast lookup: type name → { typeKey, configs map by code }
const TYPE_NAME_INDEX = {};
for (const [key, def] of Object.entries(WINDOW_TYPES)) {
  const byCode = {};
  for (const cfg of def.configurations || []) byCode[cfg.code] = cfg;
  TYPE_NAME_INDEX[def.name] = { typeKey: key, byCode };
  // Also index shorter names ("Fenêtre en arc Bow" → match "Fenêtre en arc (Bow)")
  const short = def.name.replace(/\s*\([^)]+\)/, '').trim();
  if (short !== def.name) TYPE_NAME_INDEX[short] = { typeKey: key, byCode };
}

// Patio codes
const PATIO_BY_CODE = {};
for (const cfg of PATIO_CONFIGS || []) PATIO_BY_CODE[cfg.code] = cfg;

function matchWindow(item) {
  const type = (item.type || '').trim();
  const model = (item.model || '').trim().toUpperCase();
  if (!type || !model) return null;
  // Fuzzy match type name
  let entry = TYPE_NAME_INDEX[type];
  if (!entry) {
    for (const [name, val] of Object.entries(TYPE_NAME_INDEX)) {
      if (type.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(type.toLowerCase())) {
        entry = val; break;
      }
    }
  }
  if (!entry) return null;
  const config = entry.byCode[model];
  if (!config) return null;
  return { typeKey: entry.typeKey, config };
}

function matchPatio(item) {
  const model = (item.model || '').trim();
  const type = (item.type || '').toLowerCase();
  if (!type.includes('patio')) return null;
  // Try code match against PATIO_CONFIGS; else fall back to a sensible default
  // based on panel count inferred from ouvrant
  const ouvrant = (item.ouvrant || '').toUpperCase();
  const panels = ouvrant ? ouvrant.split('').map(c => c === 'X' ? 'X' : 'O') : ['X','O'];
  return { config: { code: model, panels } };
}

function matchEntryDoor(item) {
  const type = (item.type || '').toLowerCase();
  const model = (item.model || '').trim();
  if (!type.includes('porte') || type.includes('patio')) return null;
  // Try direct style match
  const byModel = Object.keys(ENTRY_DOOR_STYLES || {}).find(k => k.toLowerCase() === model.toLowerCase());
  if (byModel) return { styleKey: byModel };
  // Fall back to plain_door if we have a style with panels=['door']
  const plain = Object.entries(ENTRY_DOOR_STYLES || {}).find(([, v]) => Array.isArray(v.panels) && v.panels.length === 1 && v.panels[0] === 'door');
  if (plain) return { styleKey: plain[0] };
  return null;
}

async function main() {
  console.log(`[backfill] mode = ${live ? 'LIVE' : 'DRY-RUN'}${customerId ? ` customer=${customerId}` : ''}${jobId ? ` job=${jobId}` : ''}`);

  let q = supabase.from('quotes').select('id, job_id, customer_id, quote_number, line_items');
  if (customerId) q = q.eq('customer_id', customerId);
  if (jobId)      q = q.eq('job_id',      jobId);
  const { data: quotes, error } = await q;
  if (error) { console.error(error); process.exit(1); }

  let quotesUpdated = 0, itemsBackfilled = 0, itemsAlready = 0, itemsNoMatch = 0;

  for (const q of quotes || []) {
    const items = Array.isArray(q.line_items) ? q.line_items : [];
    let changed = false;
    const out = items.map(it => {
      if (it._config) { itemsAlready++; return it; }
      const type = (it.type || '').toLowerCase();
      let enrich = null;
      if (type.includes('patio')) {
        const m = matchPatio(it);
        if (m) enrich = { _category: 'patio_door', _patio_collection: it.collection || null, _config: m.config };
      } else if (type.includes('porte')) {
        const m = matchEntryDoor(it);
        if (m) enrich = { _category: 'entry_door', _entry_door_style: m.styleKey };
      } else {
        const m = matchWindow(it);
        if (m) enrich = { _category: 'window', _window_type: m.typeKey, _config: m.config };
      }
      if (!enrich) { itemsNoMatch++; return it; }
      itemsBackfilled++;
      changed = true;
      return { ...it, ...enrich };
    });

    if (changed) {
      quotesUpdated++;
      if (live) {
        const { error: updErr } = await supabase.from('quotes').update({ line_items: out, updated_at: new Date().toISOString() }).eq('id', q.id);
        if (updErr) console.error(`quote ${q.id} update failed:`, updErr.message);
      }
      console.log(`  quote ${q.quote_number || q.id} → ${out.filter((x,i)=>items[i] !== x).length}/${items.length} items enriched`);
    }
  }

  console.log('');
  console.log(`quotes updated:   ${quotesUpdated}${live ? '' : ' (dry-run — no writes)'}`);
  console.log(`items enriched:   ${itemsBackfilled}`);
  console.log(`items already ok: ${itemsAlready}`);
  console.log(`items no-match:   ${itemsNoMatch}`);
}

main().catch(e => { console.error(e); process.exit(1); });
