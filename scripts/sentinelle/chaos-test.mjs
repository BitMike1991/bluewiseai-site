#!/usr/bin/env node
/**
 * Sentinelle P-10 — chaos harness.
 *
 * Each scenario has:
 *   - id              short identifier
 *   - name            human label
 *   - safe            true if fully self-contained (DB baseline tweak only) and
 *                     can run in production without affecting real traffic.
 *                     `false` scenarios touch real infra (DNS, n8n workflows,
 *                     env vars) and require human-in-the-loop arming.
 *   - expected_check_id    which Sentinelle check should detect the break
 *   - expected_status      'critical' | 'warn'
 *   - max_detect_seconds   timeout for verifying the check flipped
 *   - arm()                async — break the world
 *   - restore()            async — undo the break
 *
 * CLI:
 *   node scripts/sentinelle/chaos-test.mjs                  # safe scenarios only
 *   node scripts/sentinelle/chaos-test.mjs --scenario=A     # one specific
 *   node scripts/sentinelle/chaos-test.mjs --unsafe         # include risky ones
 *   node scripts/sentinelle/chaos-test.mjs --dry-run        # print plan, no arming
 *   node scripts/sentinelle/chaos-test.mjs --no-restore     # halt after arm (debug)
 *
 * Required env:
 *   SUPABASE_URL                  (default: production)
 *   SUPABASE_SERVICE_ROLE_KEY     (required)
 *   SENTINELLE_SECRET             (required to force-fire run-all)
 *   N8N_API_KEY                   (only for --unsafe scenarios that touch n8n)
 */

const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENTINELLE_SECRET = process.env.SENTINELLE_SECRET;
const N8N_API_KEY = process.env.N8N_API_KEY;
const RUN_ALL_URL = process.env.SENTINELLE_RUN_ALL_URL || 'https://www.bluewiseai.com/api/sentinelle/run-all';

if (!SB_KEY) { console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY env var required'); process.exit(1); }
if (!SENTINELLE_SECRET) { console.error('ERROR: SENTINELLE_SECRET env var required'); process.exit(1); }

const args = process.argv.slice(2);
const flags = {
  unsafe: args.includes('--unsafe'),
  pagesOk: args.includes('--pages-ok'),
  dryRun: args.includes('--dry-run'),
  noRestore: args.includes('--no-restore'),
  scenario: (args.find(a => a.startsWith('--scenario=')) || '').split('=')[1] || null,
};

// ─── helpers ────────────────────────────────────────────────────────────
function sb(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function getCheckBaseline(checkId) {
  const r = await fetch(`${SB_URL}/rest/v1/system_health_checks?id=eq.${encodeURIComponent(checkId)}&select=baseline,last_status`, { headers: sb() });
  if (!r.ok) throw new Error(`getCheckBaseline ${checkId} ${r.status}`);
  const rows = await r.json();
  if (rows.length === 0) throw new Error(`unknown check ${checkId}`);
  return rows[0];
}

async function patchCheckBaseline(checkId, baseline) {
  const r = await fetch(`${SB_URL}/rest/v1/system_health_checks?id=eq.${encodeURIComponent(checkId)}`, {
    method: 'PATCH', headers: sb({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ baseline }),
  });
  if (!r.ok) throw new Error(`patchCheckBaseline ${checkId} ${r.status}: ${await r.text()}`);
}

async function forceRunAll() {
  const r = await fetch(RUN_ALL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SENTINELLE_SECRET}` },
  });
  if (!r.ok) throw new Error(`run-all ${r.status}: ${await r.text()}`);
  return await r.json();
}

async function lastEvent(checkId) {
  const r = await fetch(`${SB_URL}/rest/v1/system_health_events?check_id=eq.${encodeURIComponent(checkId)}&select=status,detail,state_changed,created_at,error_payload&order=created_at.desc&limit=1`, { headers: sb() });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] || null;
}

async function waitForStatus(checkId, expectedStatus, maxSec) {
  const start = Date.now();
  while ((Date.now() - start) / 1000 < maxSec) {
    const e = await lastEvent(checkId);
    if (e?.status === expectedStatus && new Date(e.created_at).getTime() > start - 10_000) {
      return { detected_in_seconds: Math.round((Date.now() - start) / 1000), event: e };
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  return { detected_in_seconds: null, event: await lastEvent(checkId) };
}

// ─── scenarios ──────────────────────────────────────────────────────────
const scenarios = [
  // ============ SAFE: baseline manipulation only ============
  {
    id: 'A',
    name: 'vercel.last_build — fake "build too old" via baseline=0h',
    safe: true,
    expected_check_id: 'vercel.last_build',
    expected_status: 'warn',
    max_detect_seconds: 90,
    _saved: null,
    async arm() {
      const row = await getCheckBaseline(this.expected_check_id);
      this._saved = row.baseline;
      // 0.001h = ~3.6s. Real builds are minutes/hours old, so warn fires.
      // Avoid 0: `||` falsy fallback in check.js would mask the test.
      await patchCheckBaseline(this.expected_check_id, { ...row.baseline, max_age_hours: 0.001, _chaos_armed: true });
    },
    async restore() {
      if (!this._saved) return;
      await patchCheckBaseline(this.expected_check_id, this._saved);
      this._saved = null;
    },
  },
  {
    id: 'B',
    name: 'infra.ssl_expiry — fake "cert expiring soon" via warn_days=9999',
    safe: true,
    expected_check_id: 'infra.ssl_expiry',
    expected_status: 'warn',
    max_detect_seconds: 90,
    _saved: null,
    async arm() {
      const row = await getCheckBaseline(this.expected_check_id);
      this._saved = row.baseline;
      // warn_days large + critical_days small ⇒ days_left lands in the warn band, not critical.
      // (Earlier version used critical_days=9000 which forced critical because real days_left < 9000.)
      await patchCheckBaseline(this.expected_check_id, { ...row.baseline, warn_days: 9999, critical_days: 1, _chaos_armed: true });
    },
    async restore() {
      if (!this._saved) return;
      await patchCheckBaseline(this.expected_check_id, this._saved);
      this._saved = null;
    },
  },
  {
    id: 'C',
    name: 'db.rls_policy_count — bump expected by +5 to fake a policy drop',
    safe: true,
    pages_user: true, // criticality=high, to=critical ⇒ SMS to MIKAEL_ALERT_PHONE
    expected_check_id: 'db.rls_policy_count',
    expected_status: 'critical',
    max_detect_seconds: 90,
    _saved: null,
    async arm() {
      const row = await getCheckBaseline(this.expected_check_id);
      this._saved = row.baseline;
      const fakeExpected = (Number(row.baseline?.expected) || 0) + 5;
      await patchCheckBaseline(this.expected_check_id, { ...row.baseline, expected: fakeExpected, _chaos_armed: true });
    },
    async restore() {
      if (!this._saved) return;
      await patchCheckBaseline(this.expected_check_id, this._saved);
      this._saved = null;
    },
  },

  // ============ SAFE: synthetic alert path verification ============
  {
    id: 'D',
    name: 'alert pipeline — direct POST to /alert (verifies endpoint+router+SMS+email path)',
    safe: true,
    pages_user: true, // sends a synthetic CRIT to MIKAEL_ALERT_PHONE
    expected_check_id: 'mailgun.domain_verified',
    expected_status: null, // no event check, just HTTP echo
    max_detect_seconds: 10,
    async arm() {
      const r = await fetch(`${RUN_ALL_URL.replace('/run-all', '/alert')}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SENTINELLE_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_id: this.expected_check_id,
          from: 'ok', to: 'critical',
          detail: 'CHAOS-D synthetic alert path verification',
          criticality: 'critical',
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.alert_id) throw new Error(`alert endpoint ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
      this._alertId = j.alert_id;
    },
    async restore() {
      if (this._alertId) {
        await fetch(`${SB_URL}/rest/v1/system_health_alerts?id=eq.${this._alertId}`, { method: 'DELETE', headers: sb() });
        await fetch(`${SB_URL}/rest/v1/system_health_escalations?alert_id=eq.${this._alertId}&status=eq.pending`, {
          method: 'PATCH', headers: sb({ Prefer: 'return=minimal' }),
          body: JSON.stringify({ status: 'cancelled', resolved_at: new Date().toISOString() }),
        });
      }
    },
  },

  // ============ UNSAFE: real infra impact — manual arming required ============
  {
    id: 'E',
    name: 'n8n.active_count — disable one low-criticality workflow',
    safe: false,
    expected_check_id: 'n8n.active_count',
    expected_status: 'warn',
    max_detect_seconds: 360,
    notes: 'Pick a workflow you can afford to deactivate for 5min. Use n8n REST API or UI. Restore via /workflows/<id>/activate.',
    async arm() { throw new Error('manual arming required — see notes'); },
    async restore() { throw new Error('manual arming required'); },
  },
  {
    id: 'F',
    name: 'n8n.webhook.universal-inbound — rename webhook path',
    safe: false,
    expected_check_id: 'n8n.webhook.universal-inbound',
    expected_status: 'critical',
    max_detect_seconds: 360,
    notes: 'PRODUCTION CRITICAL — leads will be silently lost during the outage window. Run only in announced off-hours.',
    async arm() { throw new Error('manual arming required — see notes'); },
    async restore() { throw new Error('manual arming required'); },
  },
  {
    id: 'G',
    name: 'telnyx.account — invalidate TELNYX_API_KEY env on Vercel',
    safe: false,
    expected_check_id: 'telnyx.account',
    expected_status: 'critical',
    max_detect_seconds: 360,
    notes: 'Edit Vercel env, redeploy, observe critical, restore env, redeploy.',
    async arm() { throw new Error('manual arming required'); },
    async restore() { throw new Error('manual arming required'); },
  },
  {
    id: 'H',
    name: 'db.connect — point SUPABASE_URL to invalid host (LOCAL only — never prod)',
    safe: false,
    expected_check_id: 'db.connect',
    expected_status: 'critical',
    max_detect_seconds: 360,
    notes: 'Run in local dev env, NOT prod. Set SUPABASE_URL=https://invalid.example, hit /api/sentinelle/run-all, observe critical, revert.',
    async arm() { throw new Error('manual arming required (run local only)'); },
    async restore() { throw new Error('manual arming required'); },
  },
  {
    id: 'I',
    name: 'db.rls_policy_count — actually drop a policy (DESTRUCTIVE)',
    safe: false,
    expected_check_id: 'db.rls_policy_count',
    expected_status: 'critical',
    max_detect_seconds: 360,
    notes: 'DESTRUCTIVE: pick a policy you can recreate. CREATE POLICY ... before DROP. Use scenario C (baseline bump) for non-destructive verification.',
    async arm() { throw new Error('manual arming required — DESTRUCTIVE'); },
    async restore() { throw new Error('manual arming required'); },
  },
  {
    id: 'J',
    name: 'mailgun.domain_verified — toggle require_tls=false via API (already in this state today, scenario records procedure)',
    safe: false,
    expected_check_id: 'mailgun.domain_verified',
    expected_status: 'warn',
    max_detect_seconds: 360,
    notes: 'mg.bluewiseai.com currently has require_tls=false (production reality, persistent warn). Scenario J procedure: toggle via Mailgun API, wait for next run, observe warn flips. Real chaos here would require flipping state=disabled briefly — risk: outbound email blocked.',
    async arm() { throw new Error('manual arming required'); },
    async restore() { throw new Error('manual arming required'); },
  },
];

// ─── runner ─────────────────────────────────────────────────────────────
function pickScenarios() {
  let list = scenarios;
  if (flags.scenario) list = list.filter(s => s.id === flags.scenario);
  // Default selection: safe AND no user-paging (silent runs only).
  // --pages-ok           → also include scenarios that fire SMS/voice
  // --unsafe             → also include scenarios that touch real infra (manual arming)
  if (!flags.scenario) {
    list = list.filter(s => s.safe);
    if (!flags.pagesOk) list = list.filter(s => !s.pages_user);
    if (!flags.unsafe)  list = list.filter(s => s.safe);
  }
  return list;
}

async function runScenario(s) {
  const sep = '─'.repeat(70);
  console.log(`\n${sep}\n[${s.id}] ${s.name}`);
  console.log(`     check=${s.expected_check_id || '(n/a)'} expect=${s.expected_status || '(n/a)'} timeout=${s.max_detect_seconds}s safe=${s.safe}`);
  if (s.notes) console.log(`     notes: ${s.notes}`);

  if (flags.dryRun) {
    console.log('     [dry-run] skipping');
    return { id: s.id, status: 'skipped_dry_run' };
  }

  // ARM
  let armOk = false;
  try {
    await s.arm();
    armOk = true;
    console.log(`     ✔ armed`);
  } catch (e) {
    console.log(`     ✗ arm failed: ${e.message}`);
    return { id: s.id, status: 'arm_failed', error: e.message };
  }

  let detectResult = null;
  if (s.expected_status) {
    try {
      // Force-fire run-all so we don't have to wait for the 5-min cron
      console.log(`     ↻ force-firing /api/sentinelle/run-all to accelerate detection…`);
      await forceRunAll();
      detectResult = await waitForStatus(s.expected_check_id, s.expected_status, s.max_detect_seconds);
      if (detectResult.detected_in_seconds != null) {
        console.log(`     ✔ detected in ${detectResult.detected_in_seconds}s — status=${detectResult.event.status} state_changed=${detectResult.event.state_changed}`);
        if (detectResult.event.detail) console.log(`       detail: ${String(detectResult.event.detail).slice(0, 100)}`);
      } else {
        console.log(`     ✗ NOT detected within ${s.max_detect_seconds}s — last event status=${detectResult.event?.status}`);
      }
    } catch (e) {
      console.log(`     ✗ detection error: ${e.message}`);
    }
  } else {
    console.log(`     (no expected_status — scenario is endpoint-only)`);
  }

  if (flags.noRestore) {
    console.log(`     [--no-restore] halting; you must restore manually`);
    return { id: s.id, status: 'halted', detect: detectResult };
  }

  // RESTORE
  try {
    await s.restore();
    console.log(`     ✔ restored`);
  } catch (e) {
    console.log(`     ✗ restore failed: ${e.message}`);
    return { id: s.id, status: 'restore_failed', error: e.message, detect: detectResult };
  }

  // RECOVERY (only if armed + restored cleanly)
  let recoverResult = null;
  if (armOk && s.expected_status) {
    try {
      console.log(`     ↻ force-firing run-all again to verify recovery…`);
      await forceRunAll();
      recoverResult = await waitForStatus(s.expected_check_id, 'ok', s.max_detect_seconds);
      if (recoverResult.detected_in_seconds != null) {
        console.log(`     ✔ recovered to ok in ${recoverResult.detected_in_seconds}s`);
      } else {
        console.log(`     ⚠ recovery not detected within ${s.max_detect_seconds}s`);
      }
    } catch (e) {
      console.log(`     ⚠ recovery check error: ${e.message}`);
    }
  }

  return {
    id: s.id,
    status: detectResult?.detected_in_seconds != null ? 'pass' : 'fail_detect',
    detect_seconds: detectResult?.detected_in_seconds,
    recover_seconds: recoverResult?.detected_in_seconds,
  };
}

(async () => {
  const list = pickScenarios();
  console.log(`Sentinelle chaos: running ${list.length} scenario(s)`);
  console.log(`flags: ${JSON.stringify(flags)}`);
  const results = [];
  for (const s of list) {
    results.push(await runScenario(s));
  }

  console.log('\n══════ SUMMARY ══════');
  for (const r of results) {
    const mark = r.status === 'pass' ? '✓' : r.status === 'skipped_dry_run' ? '·' : '✗';
    console.log(`  ${mark} ${r.id}: ${r.status}${r.detect_seconds != null ? ` detect=${r.detect_seconds}s` : ''}${r.recover_seconds != null ? ` recover=${r.recover_seconds}s` : ''}`);
  }
  const passed = results.filter(r => r.status === 'pass').length;
  const total = results.filter(r => r.status !== 'skipped_dry_run').length;
  console.log(`\n${passed}/${total} passed`);
  process.exit(passed === total ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(2); });
