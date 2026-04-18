/**
 * backfill-6-rescue-final.mjs
 *
 * Regenerate the 6 rescue devis with the full formula (urethane + moulure + calking
 * + $200 overhead + $100 gaz) and update leads/jobs with real client info.
 * Merge lachute_1 + lachute_2 → job 102 (Melissa Dagenais), delete job 103.
 *
 * Usage: node scripts/backfill-6-rescue-final.mjs
 *
 * Prerequisites:
 *   SUPABASE_SERVICE_KEY env var (or script reads from credentials if available)
 */

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// Use PUR site pdf-parse v1 (functional API — v2 in bluewiseai has incompatible API)
const pdfParse = require('/root/pur-construction-site/node_modules/pdf-parse');

// ─── Dynamic ESM imports ───────────────────────────────────────────────────────
const { parseDocuments, detectType } = await import('../lib/devis/parser.js');
const { matchPrices }                = await import('../lib/devis/matcher.js');
const { computeClientPrice, computeProjectTotals, DEFAULT_PRICING, detectHardcodedType } =
  await import('../lib/devis/pricing.js');

// ─── Config ───────────────────────────────────────────────────────────────────
const CUSTOMER_ID    = 9;
const ESCOMPTE_PCT   = 40;   // Royalty confirmed — MUST be 40
const SUPABASE_URL   = 'https://xwhqkgsurssixjadzklb.supabase.co';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY;
const PUR_DIR        = '/root/pur-construction-site';
const SOUMISSION_PDF = `${PUR_DIR}/PUR37944.pdf`;

if (!SUPABASE_KEY) {
  // Try to read from credentials file
  try {
    const creds = fs.readFileSync('/root/claude-activity-logs/sops/credentials.md', 'utf8');
    const match = creds.match(/SUPABASE_SERVICE_ROLE[_KEY]*[:\s]+([a-zA-Z0-9._-]{40,})/);
    if (match) {
      process.env.SUPABASE_SERVICE_KEY = match[1];
      console.warn('[CREDS] Loaded SUPABASE_SERVICE_KEY from credentials.md');
    }
  } catch (_) {}
}

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!serviceKey) {
  console.error('FATAL: SUPABASE_SERVICE_KEY not set. Pass via env.');
  process.exit(1);
}

// ─── Client data (authoritative — from memory file) ───────────────────────────
const CLIENT_MAP = {
  99:  { name: 'Francesco Panillo', phone: '+15145833596', address: 'Montréal (Anjou)' },
  100: { name: 'Thomas Gigandet',   phone: '+15146383380', address: '7 chemin Pine Ridge, Barkmere' },
  101: { name: 'Normand Cloutier',  phone: '+15149181080', address: '24 croissant Lac Grenville' },
  102: { name: 'Melissa Dagenais',  phone: '+18192109749', address: '640 chemin Bethany, Lachute' },
  104: { name: 'Nicky Volmar',      phone: null,           address: '13300 Notre-Dame Est, Pointe-aux-Trembles, H1A 1S7' },
};

// ─── Hardcoded config (from DB — customer 9 quote_config) ─────────────────────
const HARDCODED_CONFIG = {
  porte_simple:          { base_cost: 1000, max_sides: 2, side_cost: 750, type_match: ['porte', 'simple'], material_match: [] },
  patio_5pi_pvc_blanc:   { base_cost: 859,  type_match: ['patio', '5'], material_match: ['pvc', 'blanc'] },
  patio_6pi_pvc_blanc:   { base_cost: 909,  type_match: ['patio', '6'], material_match: ['pvc', 'blanc'] },
  patio_6pi_hybride_noir:{ base_cost: 1200, type_match: ['patio', '6'], material_match: ['hybride', 'noir'] },
};

const PRICING = {
  ...DEFAULT_PRICING,
  escomptePct: ESCOMPTE_PCT,
};

// ─── PDF helpers ──────────────────────────────────────────────────────────────
function findPdf(dir, pattern) {
  const files = fs.readdirSync(dir);
  const found = files.find(f => (pattern.test ? pattern.test(f) : f.includes(pattern)));
  if (!found) throw new Error(`PDF not found matching: ${pattern} in ${dir}`);
  return `${dir}/${found}`;
}

async function extractPdf(filePath) {
  const buf = fs.readFileSync(filePath);
  const res = await pdfParse(buf);
  return res.text || '';
}

function stripBoilerplate(text) {
  return text
    .split('\n')
    .filter(line => {
      const l = line.trim();
      if (!l) return false;
      if (l.startsWith('www.groupe')) return false;
      if (l.startsWith('LAVAL :')) return false;
      if (l.startsWith('Siège social')) return false;
      if (l.includes('Page ') && l.includes(' de ')) return false;
      if (l.includes("Date d'impression")) return false;
      if (l.includes('RESPONSABILITÉ DU CLIENT')) return false;
      if (l.includes('purconstruction.com/dev/')) return false;
      if (l === 'Commande directe') return false;
      if (l === 'Vue extérieure') return false;
      if (l.startsWith('Initiale client')) return false;
      if (l.startsWith('Remarques:')) return false;
      if (l === 'Fournir Seulement') return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────
async function sbQuery(path, opts = {}) {
  const url  = `${SUPABASE_URL}/rest/v1/${path}`;
  const res  = await fetch(url, {
    ...opts,
    headers: {
      apikey:        serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer:        opts.prefer || 'return=representation',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${opts.method || 'GET'} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function sbUpdate(table, match, data) {
  const params = new URLSearchParams(match).toString();
  return sbQuery(`${table}?${params}`, {
    method:  'PATCH',
    body:    JSON.stringify(data),
    prefer:  'return=representation',
  });
}

async function sbInsert(table, data) {
  return sbQuery(table, {
    method: 'POST',
    body:   JSON.stringify(data),
    prefer: 'return=representation',
  });
}

async function sbDelete(table, match) {
  const params = new URLSearchParams(match).toString();
  return sbQuery(`${table}?${params}`, {
    method:  'DELETE',
    prefer:  'return=minimal',
    headers: {},
  });
}

async function sbSelect(table, match = {}) {
  const params = new URLSearchParams({ ...match, select: '*' }).toString();
  return sbQuery(`${table}?${params}`);
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmt(n) {
  return '$' + Number(n).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sanitize(s) {
  if (!s) return s;
  return String(s).replace(/\u0000/g, '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
}

// Normalize phone to E.164 (digits only, prepend +1 for 10-digit CA/US)
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  if (digits.length > 10) return '+' + digits;
  return null;
}

// ─── Build line_items from parsed order items ─────────────────────────────────
function buildLineItems(orderItems, soumission) {
  const lineItems = [];
  let matchedCount = 0;

  for (const item of (orderItems || [])) {
    const dimStr = item.dimensions
      ? `${item.dimensions.width ?? ''}" × ${item.dimensions.height ?? ''}"` : '';

    // First try hardcoded match (patio / porte simple)
    const hardcodedMatch = detectHardcodedType(item, HARDCODED_CONFIG);
    if (hardcodedMatch) {
      // Re-use computeClientPrice which calls computeHardcodedPrice internally
      const priceItem = { ...item, unitPrice: null };
      const { clientUnit, clientTotal, cost, _perimeter, _urethane, _moulure, _calking } =
        computeClientPrice(priceItem, PRICING, HARDCODED_CONFIG);

      const descParts = [
        sanitize(item.type) || 'Fenêtre/Porte',
        item.model && item.model !== 'N/A' ? `modèle ${sanitize(item.model)}` : null,
        dimStr || null,
        item.ouvrant ? `ouvrant ${sanitize(item.ouvrant)}` : null,
        item.specs   ? sanitize(item.specs) : null,
      ].filter(Boolean);

      lineItems.push({
        description:         descParts.join(' — '),
        qty:                 item.qty || 1,
        unit_price:          clientUnit,
        total:               clientTotal,
        type:                sanitize(item.type),
        model:               sanitize(item.model),
        ouvrant:             sanitize(item.ouvrant),
        dimensions:          item.dimensions,
        specs:               sanitize(item.specs),
        _match_confidence:   'hardcoded',
        _supplier_cost:      Math.round(cost * 100) / 100,
        _supplier:           'hardcoded',
        _bc_number:          null,
        _perimeter,
        _urethane,
        _moulure,
        _calking,
      });
      matchedCount++;
      continue;
    }

    // Supplier item — need unitPrice from soumission match
    if (item.matched && item.unitPrice) {
      const { clientUnit, clientTotal, cost, _perimeter, _urethane, _moulure, _calking } =
        computeClientPrice(item, PRICING, null); // no hardcoded for supplier items

      const descParts = [
        sanitize(item.type) || 'Fenêtre/Porte',
        item.model && item.model !== 'N/A' ? `modèle ${sanitize(item.model)}` : null,
        dimStr || null,
        item.ouvrant ? `ouvrant ${sanitize(item.ouvrant)}` : null,
        item.specs   ? sanitize(item.specs) : null,
      ].filter(Boolean);

      lineItems.push({
        description:         descParts.join(' — '),
        qty:                 item.qty || 1,
        unit_price:          clientUnit,
        total:               clientTotal,
        type:                sanitize(item.type),
        model:               sanitize(item.model),
        ouvrant:             sanitize(item.ouvrant),
        dimensions:          item.dimensions,
        specs:               sanitize(item.specs),
        _match_confidence:   'matched',
        _supplier_cost:      Math.round(cost * 100) / 100,
        _supplier:           'Royalty',
        _bc_number:          null,
        _perimeter,
        _urethane,
        _moulure,
        _calking,
      });
      matchedCount++;
    } else {
      // Unmatched — floor price, Jeremy fills later
      lineItems.push({
        description:       [sanitize(item.type) || 'Fenêtre/Porte',
                            item.model && item.model !== 'N/A' ? `modèle ${sanitize(item.model)}` : null,
                            dimStr || null,
                            '(prix plancher — à valider)'].filter(Boolean).join(' — '),
        qty:               item.qty || 1,
        unit_price:        400,
        total:             400 * (item.qty || 1),
        type:              sanitize(item.type),
        model:             sanitize(item.model),
        ouvrant:           sanitize(item.ouvrant),
        dimensions:        item.dimensions,
        specs:             sanitize(item.specs),
        _match_confidence: 'unmatched',
        _supplier_cost:    null,
        _supplier:         null,
        _bc_number:        null,
      });
    }
  }

  return { lineItems, matchedCount };
}

// ─── Build expenses for a job ─────────────────────────────────────────────────
function buildExpenses(jobId, lineItems) {
  const expenses = [];
  const now = new Date().toISOString().split('T')[0];

  // materiel_fournisseur: supplier cost × qty per matched/hardcoded item
  let supplierTotal = 0;
  let materieleIncluse = 0;
  for (const li of lineItems) {
    if (li._supplier_cost != null) {
      supplierTotal  += li._supplier_cost * (li.qty || 1);
      // materiel_incluse = urethane + moulure + calking per item × qty
      const supplyFees = ((li._urethane || 0) + (li._moulure || 0) + (li._calking || 0)) * (li.qty || 1);
      materieleIncluse += supplyFees;
    }
  }

  if (supplierTotal > 0) {
    expenses.push({
      customer_id:    CUSTOMER_ID,
      job_id:         jobId,
      category:       'materiel_fournisseur',
      subtotal:       Math.round(supplierTotal * 100) / 100,
      total:          Math.round(supplierTotal * 100) / 100,
      description:    'Fenêtres Royalty — coût fournisseur (escompte 40%)',
      source:         'backfill_rescue',
      paid_at:        now,
    });
  }

  if (materieleIncluse > 0) {
    expenses.push({
      customer_id:    CUSTOMER_ID,
      job_id:         jobId,
      category:       'materiel_incluse',
      subtotal:       Math.round(materieleIncluse * 100) / 100,
      total:          Math.round(materieleIncluse * 100) / 100,
      description:    'Uréthane + moulure + calfeutrage (estimé par item)',
      source:         'backfill_rescue',
      paid_at:        now,
    });
  }

  expenses.push({
    customer_id:    CUSTOMER_ID,
    job_id:         jobId,
    category:       'overhead',
    subtotal:       200,
    total:          200,
    description:    'Overhead projet',
    source:         'backfill_rescue',
    paid_at:        now,
  });

  expenses.push({
    customer_id:    CUSTOMER_ID,
    job_id:         jobId,
    category:       'gaz_carburant',
    subtotal:       100,
    total:          100,
    description:    'Gaz / visite client',
    source:         'backfill_rescue',
    paid_at:        now,
  });

  return expenses;
}

// ─── Dedup check ─────────────────────────────────────────────────────────────
async function checkDuplicateLeads(currentLeadId, phone) {
  if (!phone) return [];
  const digits = phone.replace(/\D/g, '');
  const suffix = digits.slice(-10);
  // Use ilike with normalized phone stored in leads
  const all = await sbSelect('leads', { customer_id: `eq.${CUSTOMER_ID}`, select: 'id,name,phone' });
  return (all || []).filter(l => {
    if (l.id === currentLeadId) return false;
    const ld = (l.phone || '').replace(/\D/g, '');
    return ld.endsWith(suffix);
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

console.log('\n=== BACKFILL 6 RESCUE DEVIS — FULL FORMULA ===\n');
console.log(`Escompte Royalty : ${ESCOMPTE_PCT}%`);
console.log(`Formula: cost×1.20 + perim×$3 + urethane/150"×$6.75 + moulure×$0.04 + calking/120"×$6.75`);
console.log(`Per project: +$200 overhead, +$100 gaz\n`);

// ─── 1. Parse soumission PDF ──────────────────────────────────────────────────
console.log('[1] Parsing soumission PUR37944.pdf...');
let parsedSoumission;
try {
  const rawSou = await extractPdf(SOUMISSION_PDF);
  const strSou = stripBoilerplate(rawSou);
  const souFile = { filename: 'PUR37944.pdf', type: 'soumission', text: strSou };
  const parsed = await parseDocuments([souFile]);
  parsedSoumission = parsed.soumission;
  if (!parsedSoumission?.items?.length) throw new Error('0 items parsed');
  console.log(`   Soumission No.: ${parsedSoumission.soumissionNumber}`);
  console.log(`   Escompte detected: ${parsedSoumission.escomptePct}% (overriding with ${ESCOMPTE_PCT}%)`);
  console.log(`   Items: ${parsedSoumission.items.length}`);
} catch (err) {
  console.error('FATAL: Could not parse soumission:', err.message);
  process.exit(1);
}

// ─── 2. Parse all bons de commande ────────────────────────────────────────────
console.log('\n[2] Parsing bons de commande...');
const BON_DEFS = [
  { key: 'anjou',    jobId: 99,  pattern: /anjou/i },
  { key: 'barkmere', jobId: 100, pattern: /barkmere/i },
  { key: 'grenville',jobId: 101, pattern: /grenville/i },
  { key: 'lachute1', jobId: 102, pattern: /lachute_1/i },  // merge part 1
  { key: 'lachute2', jobId: 102, pattern: /lachute_2/i },  // merge part 2
  { key: 'pointe',   jobId: 104, pattern: /pointe/i },
];

const parsedBons = {};  // key → { items, filename }
for (const def of BON_DEFS) {
  try {
    const filePath = findPdf(PUR_DIR, def.pattern);
    const raw      = await extractPdf(filePath);
    const stripped = stripBoilerplate(raw);
    const bonFile  = { filename: path.basename(filePath), type: 'bon_commande', text: stripped.slice(0, 6000) };
    const { orders } = await parseDocuments([bonFile]);
    const order = orders?.[0] || { items: [] };
    parsedBons[def.key] = { items: order.items || [], filename: path.basename(filePath) };
    console.log(`   [OK] ${def.key} (${path.basename(filePath)}): ${order.items?.length || 0} items`);
  } catch (err) {
    console.error(`   [ERR] ${def.key}: ${err.message}`);
    parsedBons[def.key] = { items: [], filename: def.key, error: err.message };
  }
}

// ─── 3. Merge lachute_1 + lachute_2 ──────────────────────────────────────────
// Both belong to job 102 (Melissa Dagenais)
const lachuteItems = [
  ...(parsedBons.lachute1?.items || []),
  ...(parsedBons.lachute2?.items || []),
];
console.log(`\n[3] Lachute merge: lachute_1 (${parsedBons.lachute1?.items?.length || 0}) + lachute_2 (${parsedBons.lachute2?.items?.length || 0}) = ${lachuteItems.length} items`);

// Job → items map
const JOB_ITEMS = {
  99:  parsedBons.anjou?.items    || [],
  100: parsedBons.barkmere?.items || [],
  101: parsedBons.grenville?.items|| [],
  102: lachuteItems,
  104: parsedBons.pointe?.items   || [],
};

// ─── 4. Match prices & compute with new formula ───────────────────────────────
console.log('\n[4] Matching prices from soumission...');
const results = {};

for (const [jobIdStr, rawItems] of Object.entries(JOB_ITEMS)) {
  const jobId = Number(jobIdStr);
  // matchPrices takes array of orders + soumission
  const fakeOrder = { items: rawItems };
  const [enrichedOrder] = matchPrices([fakeOrder], parsedSoumission);
  const { lineItems, matchedCount } = buildLineItems(enrichedOrder.items, parsedSoumission);

  const totals = computeProjectTotals(lineItems, PRICING);

  results[jobId] = {
    jobId,
    client:         CLIENT_MAP[jobId],
    lineItems,
    matchedCount,
    totalItems:     rawItems.length,
    totals,
    expenses:       buildExpenses(jobId, lineItems),
  };

  console.log(`   Job ${jobId}: ${rawItems.length} items, ${matchedCount} matched/${rawItems.length}, TTC = ${fmt(totals.total_ttc)}`);
}

// ─── 5. Load current jobs to get lead_ids + quote ids ─────────────────────────
console.log('\n[5] Loading current jobs + quotes...');
const currentJobs = await sbSelect('jobs', { customer_id: `eq.${CUSTOMER_ID}`, id: `in.(99,100,101,102,103,104)` });
const currentQuotes = await sbSelect('quotes', { customer_id: `eq.${CUSTOMER_ID}`, job_id: `in.(99,100,101,102,103,104)` });
const jobsById   = Object.fromEntries((currentJobs   || []).map(j => [j.id, j]));
const quotesById = Object.fromEntries((currentQuotes || []).map(q => [q.job_id, q]));

// ─── 6. Dedup check for leads ─────────────────────────────────────────────────
console.log('\n[6] Checking for duplicate leads...');
const dupReport = [];
for (const [jobIdStr, r] of Object.entries(results)) {
  const jobId   = Number(jobIdStr);
  const job     = jobsById[jobId];
  const client  = r.client;
  if (!client?.phone) {
    console.log(`   Job ${jobId} (${client?.name}): no phone — skip dedup`);
    continue;
  }
  const currentLeadId = job?.lead_id;
  const dups = await checkDuplicateLeads(currentLeadId, client.phone);
  if (dups.length > 0) {
    const msg = `Job ${jobId} (${client.name}): potential duplicate with lead(s) ${dups.map(d => `#${d.id} "${d.name}" ${d.phone}`).join(', ')}`;
    dupReport.push(msg);
    console.warn(`   [DEDUP] ${msg}`);
  } else {
    console.log(`   Job ${jobId}: no duplicates for ${client.phone}`);
  }
}

// ─── 7. Delete job 103 (merged into 102) ─────────────────────────────────────
console.log('\n[7] Deleting job 103 (merged into 102)...');
let deleted103 = { quotes: 0, job: false };

// Delete quote 103 first (FK → jobs)
const q103 = quotesById[103];
if (q103) {
  await sbDelete('quotes', { customer_id: `eq.${CUSTOMER_ID}`, job_id: `eq.103` });
  deleted103.quotes = 1;
  console.log(`   Deleted quote id=${q103.id} (PUR-442739)`);
}

// Delete job 103 itself
try {
  await sbDelete('jobs', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.103` });
  deleted103.job = true;
  console.log(`   Deleted job 103 (PUR-442739)`);
} catch (err) {
  console.error(`   WARN: Could not delete job 103: ${err.message}`);
}

// ─── 8. Update each job/quote/lead ────────────────────────────────────────────
console.log('\n[8] Updating jobs, quotes, leads, and inserting expenses...\n');

const summary = [];

for (const [jobIdStr, r] of Object.entries(results)) {
  const jobId  = Number(jobIdStr);
  const job    = jobsById[jobId];
  const quote  = quotesById[jobId];
  const client = r.client;

  console.log(`--- Job ${jobId} (${client?.name}) ---`);

  if (!job) {
    console.error(`   SKIP: job ${jobId} not found in DB`);
    summary.push({ jobId, error: 'job not found' });
    continue;
  }

  // 8a. Update job with real client info
  const jobUpdate = {
    client_name:    client.name,
    client_address: client.address,
    updated_at:     new Date().toISOString(),
  };
  if (client.phone) jobUpdate.client_phone = normalizePhone(client.phone);

  await sbUpdate('jobs', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.${jobId}` }, jobUpdate);
  console.log(`   Job updated: name="${client.name}" address="${client.address}"`);

  // 8b. Update or create lead
  if (job.lead_id) {
    const leadUpdate = { name: client.name, updated_at: new Date().toISOString() };
    if (client.address) leadUpdate.address = client.address;
    if (client.phone) {
      const normalized = normalizePhone(client.phone);
      if (normalized) leadUpdate.phone = normalized;
    }
    await sbUpdate('leads', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.${job.lead_id}` }, leadUpdate);
    console.log(`   Lead ${job.lead_id} updated`);
  } else {
    // Check if lead already exists with this phone
    let existingLead = null;
    if (client.phone) {
      const normalized = normalizePhone(client.phone);
      if (normalized) {
        const allLeads = await sbSelect('leads', { customer_id: `eq.${CUSTOMER_ID}`, phone: `eq.${normalized}` });
        existingLead = allLeads?.[0] || null;
      }
    }

    if (existingLead) {
      // Link existing lead
      await sbUpdate('jobs', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.${jobId}` }, { lead_id: existingLead.id });
      await sbUpdate('leads', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.${existingLead.id}` }, {
        name:       client.name,
        address:    client.address,
        updated_at: new Date().toISOString(),
      });
      console.log(`   Linked existing lead ${existingLead.id} (${existingLead.name})`);
    } else {
      // Create new lead
      const newLeads = await sbInsert('leads', [{
        customer_id: CUSTOMER_ID,
        name:        client.name,
        phone:       normalizePhone(client.phone),
        address:     client.address,
        source:      'backfill_rescue',
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      }]);
      const newLead = newLeads?.[0];
      if (newLead) {
        await sbUpdate('jobs', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.${jobId}` }, { lead_id: newLead.id });
        console.log(`   Created new lead ${newLead.id} and linked to job ${jobId}`);
      }
    }
  }

  // 8c. Update quote with new line_items + totals
  if (!quote) {
    console.error(`   WARN: No quote found for job ${jobId}`);
  } else {
    const { totals, lineItems } = r;
    await sbUpdate('quotes',
      { customer_id: `eq.${CUSTOMER_ID}`, job_id: `eq.${jobId}` },
      {
        line_items:  lineItems,  // pass array directly — sbUpdate already JSON.stringifies the whole body
        subtotal:    totals.subtotal,
        tax_gst:     totals.tax_gst,
        tax_qst:     totals.tax_qst,
        total_ttc:   totals.total_ttc,
        status:      'ready',
        updated_at:  new Date().toISOString(),
        notes:       `Devis recalculé avec formule complète (uréthane+moulure+calfeutrage+overhead+gaz). Escompte Royalty: ${ESCOMPTE_PCT}%.`,
      }
    );
    console.log(`   Quote updated: subtotal=${fmt(totals.subtotal)} TTC=${fmt(totals.total_ttc)} (${lineItems.length} items)`);
  }

  // 8d. Delete old backfill expenses for this job, insert new ones
  try {
    await sbDelete('expenses', { customer_id: `eq.${CUSTOMER_ID}`, job_id: `eq.${jobId}`, source: `eq.backfill_rescue` });
  } catch (_) {}

  for (const exp of r.expenses) {
    await sbInsert('expenses', [exp]);
  }
  const expTotal = r.expenses.reduce((s, e) => s + e.total, 0);
  console.log(`   Expenses inserted: ${r.expenses.length} rows, total ${fmt(expTotal)}`);

  summary.push({
    jobId,
    name:         client.name,
    totalItems:   r.totalItems,
    matchedCount: r.matchedCount,
    subtotal:     r.totals.subtotal,
    total_ttc:    r.totals.total_ttc,
    quoteNumber:  quote?.quote_number,
    expTotal,
    unmatchedItems: r.lineItems.filter(l => l._match_confidence === 'unmatched'),
  });
}

// ─── 9. Verification queries ──────────────────────────────────────────────────
console.log('\n[9] Post-backfill verification...\n');

const verifyJobs = await sbSelect('jobs', {
  customer_id: `eq.${CUSTOMER_ID}`,
  id: `in.(99,100,101,102,104)`,
  select: 'id,job_id,client_name,client_phone,client_address,lead_id,status',
});
const verifyQuotes = await sbSelect('quotes', {
  customer_id: `eq.${CUSTOMER_ID}`,
  job_id: `in.(99,100,101,102,104)`,
  select: 'job_id,quote_number,status,subtotal,total_ttc',
});

// Confirm 103 gone
let job103check;
try {
  job103check = await sbSelect('jobs', { customer_id: `eq.${CUSTOMER_ID}`, id: `eq.103` });
} catch (_) { job103check = []; }

// ─── 10. Output summary ───────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║              BACKFILL SUMMARY                                    ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');

for (const r of summary) {
  if (r.error) {
    console.log(`║ Job ${r.jobId}: ERROR — ${r.error}`);
    continue;
  }
  const unm = r.unmatchedItems?.length || 0;
  const baseUrl = 'https://pur-construction-site.vercel.app/q';
  const publicUrl = r.quoteNumber ? `${baseUrl}/${r.quoteNumber}` : '(no quote)';
  console.log(`║`);
  console.log(`║ Job ${r.jobId} — ${r.name}`);
  console.log(`║   Items: ${r.matchedCount}/${r.totalItems} matched  |  Subtotal: ${fmt(r.subtotal)}  |  TTC: ${fmt(r.total_ttc)}`);
  console.log(`║   Expenses: ${fmt(r.expTotal)}  |  Unmatched: ${unm}`);
  console.log(`║   Public URL: ${publicUrl}`);
  if (unm > 0) {
    console.log(`║   *** UNMATCHED — Jérémy doit valider: ***`);
    for (const u of r.unmatchedItems) {
      console.log(`║     - ${u.description}`);
    }
  }
}

console.log('║');
console.log(`║ Job 103: ${deleted103.job ? 'DELETED' : 'DELETE FAILED'} (${deleted103.quotes} quote(s) deleted)`);
console.log('║');

if (dupReport.length > 0) {
  console.log('║ DEDUP WARNINGS (not merged — needs Mikael approval):');
  for (const d of dupReport) console.log(`║   - ${d}`);
  console.log('║');
}

console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║ JOBS AFTER BACKFILL:');
for (const j of (verifyJobs || [])) {
  console.log(`║   id=${j.id} | job_id=${j.job_id} | client="${j.client_name}" | lead_id=${j.lead_id}`);
}
console.log('║');
console.log('║ QUOTES AFTER BACKFILL:');
for (const q of (verifyQuotes || [])) {
  console.log(`║   job_id=${q.job_id} | quote=${q.quote_number} | status=${q.status} | TTC=${fmt(q.total_ttc)}`);
}
console.log('║');
console.log(`║ Job 103 still exists: ${(job103check || []).length > 0 ? 'YES — DELETE FAILED' : 'NO (correctly deleted)'}`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

console.log('\n=== BACKFILL COMPLETE ===\n');
