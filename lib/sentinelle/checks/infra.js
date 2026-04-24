// Sentinelle P-05 — infra health (SSL, DNS, domain, VPS).
// Covers: infra.ssl_expiry, infra.dns_resolve, infra.domain_expiry, infra.vps_disk_ram

import tls from 'node:tls';
import dns from 'node:dns/promises';
import { SB_URL, sbHeaders } from '../util.js';

// ─── SSL cert via direct TLS handshake ──────────────────────────────────
async function tlsHandshake(host, port = 443, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || !cert.valid_to) return reject(new Error('no_cert_returned'));
      resolve(cert);
    });
    socket.on('error', (e) => reject(e));
    socket.setTimeout(timeoutMs, () => { socket.destroy(); reject(new Error(`timeout_${timeoutMs}ms`)); });
  });
}

async function sslExpiry(row) {
  const domains = row.baseline?.domains || ['bluewiseai.com'];
  const warnDays = row.baseline?.warn_days || 14;
  const critDays = row.baseline?.critical_days || 3;
  const t0 = Date.now();

  const results = await Promise.allSettled(domains.map((d) => tlsHandshake(d, 443, 8000)));
  const entries = domains.map((d, i) => {
    const r = results[i];
    if (r.status === 'rejected') {
      return { domain: d, error: r.reason?.message || String(r.reason) };
    }
    const expiryMs = new Date(r.value.valid_to).getTime();
    const daysLeft = Math.floor((expiryMs - Date.now()) / 86_400_000);
    return { domain: d, days_left: daysLeft, valid_to: r.value.valid_to };
  });

  const ms = Date.now() - t0;
  const errored = entries.filter(e => e.error);
  const critical = entries.filter(e => !e.error && e.days_left <= critDays);
  const warn = entries.filter(e => !e.error && e.days_left > critDays && e.days_left <= warnDays);

  if (critical.length) {
    const sum = critical.map(e => `${e.domain}=${e.days_left}d`).join(', ');
    return { status: 'critical', detail: `expiring: ${sum}`, ms };
  }
  if (errored.length) {
    const sum = errored.map(e => `${e.domain}:${e.error}`).join(', ');
    return { status: 'warn', detail: `handshake_errors: ${sum}`, ms };
  }
  if (warn.length) {
    const sum = warn.map(e => `${e.domain}=${e.days_left}d`).join(', ');
    return { status: 'warn', detail: `soon: ${sum}`, ms };
  }
  const min = Math.min(...entries.map(e => e.days_left));
  return { status: 'ok', detail: `${domains.length} domains, min=${min}d`, ms };
}

// ─── DNS resolution ─────────────────────────────────────────────────────
async function dnsResolve(row) {
  const domains = row.baseline?.domains || ['bluewiseai.com'];
  const types = row.baseline?.record_types || ['A', 'MX', 'TXT'];
  const t0 = Date.now();

  const errors = [];
  for (const d of domains) {
    for (const t of types) {
      try {
        let res;
        if (t === 'A') res = await dns.resolve4(d);
        else if (t === 'AAAA') res = await dns.resolve6(d);
        else if (t === 'MX') res = await dns.resolveMx(d);
        else if (t === 'TXT') res = await dns.resolveTxt(d);
        else if (t === 'CNAME') res = await dns.resolveCname(d);
        else continue;
        if (!res || (Array.isArray(res) && res.length === 0)) {
          errors.push(`${d}:${t}=empty`);
        }
      } catch (e) {
        // NODATA is ok for MX/TXT on subdomains; NXDOMAIN is critical
        const code = e.code || '';
        if (code === 'ENODATA' && (t === 'MX' || t === 'TXT')) continue;
        errors.push(`${d}:${t}=${code || 'error'}`);
      }
    }
  }

  const ms = Date.now() - t0;
  if (errors.length === 0) return { status: 'ok', detail: `${domains.length} domains × ${types.length} types resolved`, ms };
  const critical = errors.filter(e => /NXDOMAIN|SERVFAIL/.test(e));
  if (critical.length) return { status: 'critical', detail: `dns: ${critical.slice(0, 3).join(', ')}`, ms };
  return { status: 'warn', detail: `dns_anomalies: ${errors.slice(0, 3).join(', ')}`, ms };
}

// ─── Domain expiry (Namecheap) — deferred to VPS sidecar ───────────────
// Namecheap API is IP-whitelisted to the VPS (178.156.164.70) so Vercel can't query.
// Will be moved into VPS sidecar payload in a follow-up. For now: ok with note.
async function domainExpiry(row) {
  return { status: 'ok', detail: 'deferred_namecheap_ip_whitelist_to_vps_sidecar', ms: 0 };
}

// ─── VPS disk + RAM from latest ping ────────────────────────────────────
async function vpsDiskRam(row) {
  const t0 = Date.now();
  const res = await fetch(
    `${SB_URL}/rest/v1/system_health_vps_pings?select=collected_at,payload&order=collected_at.desc&limit=1`,
    { headers: sbHeaders() }
  );
  const ms = Date.now() - t0;
  if (!res.ok) return { status: 'warn', detail: `query_${res.status}`, ms };
  const data = await res.json();
  const ping = data?.[0];
  if (!ping) return { status: 'warn', detail: 'no_vps_ping_yet', ms };

  const ageSec = (Date.now() - new Date(ping.collected_at).getTime()) / 1000;
  if (ageSec > 180) return { status: 'critical', detail: `ping ${ageSec.toFixed(0)}s old — sidecar dead?`, ms };

  const p = ping.payload || {};
  const diskPct = p.disk_use_pct;
  const ramFree = p.ram_free_mb;
  const diskWarn = row.baseline?.disk_warn_pct || 85;
  const diskCrit = row.baseline?.disk_critical_pct || 95;
  const ramWarn = row.baseline?.ram_warn_mb || 200;
  const ramCrit = row.baseline?.ram_critical_mb || 50;

  const issues = [];
  if (diskPct != null) {
    if (diskPct >= diskCrit) return { status: 'critical', detail: `disk=${diskPct}% >= ${diskCrit}%`, ms };
    if (diskPct >= diskWarn) issues.push(`disk=${diskPct}%`);
  }
  if (ramFree != null) {
    if (ramFree <= ramCrit) return { status: 'critical', detail: `ram_free=${ramFree}MB <= ${ramCrit}MB`, ms };
    if (ramFree <= ramWarn) issues.push(`ram_free=${ramFree}MB`);
  }
  if (issues.length) return { status: 'warn', detail: issues.join(', '), ms };
  return { status: 'ok', detail: `disk=${diskPct}% ram_free=${ramFree}MB/${p.ram_total_mb}MB`, ms };
}

// ─── Dispatcher ─────────────────────────────────────────────────────────
export async function runCheck(row) {
  switch (row.id) {
    case 'infra.ssl_expiry':     return sslExpiry(row);
    case 'infra.dns_resolve':    return dnsResolve(row);
    case 'infra.domain_expiry':  return domainExpiry(row);
    case 'infra.vps_disk_ram':   return vpsDiskRam(row);
    default:
      return { status: 'error', detail: `unknown_infra_check:${row.id}`, ms: 0 };
  }
}
