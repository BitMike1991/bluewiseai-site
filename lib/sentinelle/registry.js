// Sentinelle P-01 — registry loader.
// Fetches enabled check rows from system_health_checks.

const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function loadEnabledChecks() {
  if (!SB_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  const url = `${SB_URL}/rest/v1/system_health_checks?enabled=eq.true&select=*&order=category,id`;
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`loadEnabledChecks ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
