// lib/qbo/taxMappings.js
// Fetch realm TaxCode list, auto-seed BW tax type → QBO TaxCode.Id mappings,
// and resolve mappings at push time.
//
// Quebec QBO sandbox typically ships with TaxCode names like:
//   - "GST"   (5 % federal)
//   - "QST"   (9.975 % provincial)
//   - "GST/QST" or "GST + QST" (combined — applies both rates)
// Heuristics below match by case-insensitive name keywords. If the realm has
// a non-standard naming convention, the owner/admin can override via the
// settings UI.

import { getSupabaseServerClient } from "../supabaseServer";

/**
 * Query the realm's TaxCode list (active only).
 * Returns: [{ Id, Name, Description, Active, Taxable, TaxGroup, SalesTaxRateList }]
 */
export async function fetchRealmTaxCodes(qbo) {
  const sql = encodeURIComponent("select * from TaxCode where Active = true maxresults 1000");
  const resp = await qbo.get(`/company/${qbo.realmId}/query?minorversion=70&query=${sql}`);
  return resp?.QueryResponse?.TaxCode || [];
}

const RX = {
  gst: /\b(gst|tps|federal)\b/i,
  qst: /\b(qst|tvq|quebec|québec)\b/i,
  combined: /\b(gst.*qst|tps.*tvq|gst\s*\+\s*qst|tps\s*\+\s*tvq|gst\/qst|tps\/tvq)\b/i,
  exempt: /\b(exempt|out\s*of\s*scope|zero[\s-]*rated|no\s*tax|nontax|non[\s-]*taxable)\b/i,
};

/**
 * Pick the best TaxCode match for a given BW type from a list of realm codes.
 * Combined match must mention BOTH gst and qst tokens; exempt is the literal
 * non-taxable code.
 */
export function pickTaxCode(taxCodes, bwType) {
  const candidates = taxCodes.filter(c => c.Active !== false);
  if (bwType === "both") {
    return candidates.find(c => RX.combined.test(`${c.Name} ${c.Description || ""}`)) || null;
  }
  if (bwType === "tps") {
    return candidates.find(c => RX.gst.test(c.Name) && !RX.qst.test(c.Name)) || null;
  }
  if (bwType === "tvq") {
    return candidates.find(c => RX.qst.test(c.Name) && !RX.gst.test(c.Name)) || null;
  }
  if (bwType === "exempt") {
    return candidates.find(c => RX.exempt.test(`${c.Name} ${c.Description || ""}`)) || null;
  }
  return null;
}

/**
 * Auto-seed mappings for a tenant. Returns { seeded, skipped, missing }.
 * Existing rows are NOT overwritten — admins keep their overrides.
 */
export async function autoSeedTaxMappings(customerId, qbo) {
  const taxCodes = await fetchRealmTaxCodes(qbo);
  const admin = getSupabaseServerClient();

  const { data: existing } = await admin
    .from("qbo_tax_mappings")
    .select("bw_tax_type")
    .eq("customer_id", customerId);
  const have = new Set((existing || []).map(r => r.bw_tax_type));

  const seeded = [];
  const skipped = [];
  const missing = [];
  const wanted = ["both", "tps", "tvq", "exempt"];

  for (const bwType of wanted) {
    if (have.has(bwType)) {
      skipped.push(bwType);
      continue;
    }
    const code = pickTaxCode(taxCodes, bwType);
    if (!code) {
      missing.push(bwType);
      continue;
    }
    const { error } = await admin
      .from("qbo_tax_mappings")
      .insert({
        customer_id: customerId,
        bw_tax_type: bwType,
        qbo_tax_code_id: String(code.Id),
        qbo_tax_code_name: code.Name,
        qbo_description: code.Description || null,
        auto_seeded: true,
      });
    if (error) {
      missing.push(`${bwType}:${error.message}`);
    } else {
      seeded.push({ bw_tax_type: bwType, qbo_tax_code_id: String(code.Id), qbo_tax_code_name: code.Name });
    }
  }

  return { seeded, skipped, missing, available_codes: taxCodes.map(c => ({ id: String(c.Id), name: c.Name, description: c.Description })) };
}

/**
 * Read the resolved mapping the push-invoice path needs:
 *   { both, tps, tvq, exempt } → { qbo_tax_code_id, qbo_tax_code_name } | null
 */
export async function getTaxMappings(customerId) {
  const admin = getSupabaseServerClient();
  const { data, error } = await admin
    .from("qbo_tax_mappings")
    .select("bw_tax_type, qbo_tax_code_id, qbo_tax_code_name")
    .eq("customer_id", customerId);
  if (error) throw new Error(`tax mappings lookup failed: ${error.message}`);
  const out = { both: null, tps: null, tvq: null, exempt: null };
  for (const r of data || []) {
    out[r.bw_tax_type] = { id: r.qbo_tax_code_id, name: r.qbo_tax_code_name };
  }
  return out;
}
