#!/usr/bin/env node
// scripts/qbo-smoke.mjs
// Read-only smoke test for P01 QBO plumbing.
// Usage: node scripts/qbo-smoke.mjs <customerId>
//
// Verifies from outside the Next runtime:
//   - QBO_* env vars present
//   - accounting_connections row exists (after OAuth) + decrypt round-trips
//   - Risk-1: quotes rows have tax_gst/tax_qst, NOT tps/tvq
//   - Risk-3: cid=1 customers.quote_config seeded
//
// This script does NOT live-push to QBO. After OAuth, run:
//   curl -X POST https://<domain>/api/qbo/push-invoice -H "Cookie: sb-access-token=..." -d '{"quote_id":64}'

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const customerId = Number(process.argv[2]);
if (!customerId) {
  console.error("Usage: node scripts/qbo-smoke.mjs <customerId>");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !srk) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
  process.exit(2);
}
const sb = createClient(url, srk, { auth: { persistSession: false } });

// Inline copy of lib/tokenEncryption.js (AES-256-GCM). Standalone scripts can't
// import Next-runtime modules without a build step.
function getKey() {
  const k = process.env.OAUTH_ENCRYPTION_KEY || process.env.HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return crypto.createHash("sha256").update(k).digest();
}
function decryptToken(ciphertext) {
  if (!ciphertext) return null;
  try {
    const key = getKey();
    const buf = Buffer.from(ciphertext, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
    dec.setAuthTag(tag);
    return dec.update(enc, undefined, "utf8") + dec.final("utf8");
  } catch {
    return null;
  }
}

const report = { ok: 0, warn: 0, fail: 0 };
function check(label, ok, detail = "") {
  const tag = ok === true ? "OK  " : ok === "warn" ? "WARN" : "FAIL";
  console.log(`[${tag}] ${label.padEnd(46)} ${detail}`);
  if (ok === true) report.ok++;
  else if (ok === "warn") report.warn++;
  else report.fail++;
}

// 1. QBO env
const qboMissing = ["QBO_CLIENT_ID","QBO_CLIENT_SECRET","QBO_REDIRECT_URI"].filter(k => !process.env[k]);
check("env.QBO_* present", qboMissing.length ? "warn" : true,
  qboMissing.length ? `missing: ${qboMissing.join(",")} (set on Vercel + .env.local)` : `env=${process.env.QBO_ENVIRONMENT || "sandbox"}`);

// 2. accounting_connections
const { data: conn, error: cErr } = await sb
  .from("accounting_connections")
  .select("customer_id, provider, realm_id, environment, status, expires_at, access_token_encrypted, refresh_token_encrypted")
  .eq("customer_id", customerId).eq("provider", "qbo").maybeSingle();

if (cErr) check("accounting_connections query", false, cErr.message);
else if (!conn) check("accounting_connections row exists", "warn", `none for customer ${customerId} — run OAuth`);
else {
  check("accounting_connections row exists", true, `realm=${conn.realm_id} status=${conn.status}`);
  const acc = conn.access_token_encrypted ? decryptToken(conn.access_token_encrypted) : null;
  const ref = conn.refresh_token_encrypted ? decryptToken(conn.refresh_token_encrypted) : null;
  check("access_token round-trip decrypt", !!acc, acc ? `${acc.slice(0,10)}…` : "(null)");
  check("refresh_token round-trip decrypt", !!ref, ref ? `${ref.slice(0,10)}…` : "(null)");
}

// 3. Risk-1 — quotes has tax_gst/tax_qst (not tps/tvq)
const { data: q } = await sb
  .from("quotes")
  .select("id, customer_id, subtotal, tax_gst, tax_qst, total_ttc, line_items")
  .eq("customer_id", customerId).order("id").limit(1).maybeSingle();

if (!q) check("sample quote for mapper check", "warn", `no quotes for customer ${customerId}`);
else {
  const hasRight = q.tax_gst != null && q.tax_qst != null;
  check("risk-1 quote.tax_gst + tax_qst present", hasRight,
    hasRight ? `gst=${q.tax_gst} qst=${q.tax_qst}` : `unexpected null — schema drift`);
  const sum = Number(q.subtotal) + Number(q.tax_gst) + Number(q.tax_qst);
  const drift = Math.abs(sum - Number(q.total_ttc));
  check("quote math (subtotal+gst+qst == total_ttc)", drift < 0.05, `drift=${drift.toFixed(4)} on quote ${q.id}`);
  const lineCount = Array.isArray(q.line_items) ? q.line_items.length : 0;
  check("quote has line_items for mapper", lineCount > 0, `n=${lineCount}`);
}

// 4. Risk-3 — cid=1 quote_config scaffolded
const { data: bw } = await sb
  .from("customers").select("id, quote_config").eq("id", 1).maybeSingle();
const bwKeys = bw?.quote_config ? Object.keys(bw.quote_config) : [];
check("risk-3 cid=1 quote_config seeded", bwKeys.length > 0, bwKeys.join(","));

// 5. quotes.qbo_* columns exist (confirmed by select success)
const { error: colErr } = await sb.from("quotes").select("qbo_invoice_id, qbo_synced_at, qbo_last_error").limit(1);
check("quotes.qbo_* columns exist", !colErr, colErr ? colErr.message : "qbo_invoice_id, qbo_synced_at, qbo_last_error");

const total = report.ok + report.warn + report.fail;
console.log("---");
console.log(`P01 smoke: ${report.ok}/${total} ok · ${report.warn} warn · ${report.fail} fail`);
process.exit(report.fail === 0 ? 0 : 1);
