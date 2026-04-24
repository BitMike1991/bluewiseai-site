# SENTINELLE — System Health Monitoring Chain

**Built via:** prompt-architect SOP (`/root/claude-activity-logs/sops/prompt-architect.md`)
**Date drafted:** 2026-04-22 (S167+1, Mikael request: "rien de trop, au plus robuste partout")
**Goal:** Total-surface monitoring for BlueWise platform. Alert Mikael by SMS+email+voice escalation on ANY failure across n8n, Next.js, Supabase, external services, infra, and data quality. Subsume `/root/n8n-webhook-healthcheck.sh`.
**Total effort:** ~13–15h (atomic, shippable per prompt)
**Dependencies:** sequential unless noted. Never skip a prompt.

---

## Global context (read once before any prompt)

- **Repo:** `/root/bluewiseai-site` (Next.js 15.5 Pages Router, multi-tenant SaaS, `customer_id` isolation).
- **Supabase project:** `xwhqkgsurssixjadzklb` (BW/PUR/Ramoneur/SP tenants).
- **n8n:** `https://automation.bluewiseai.com` (pm2 on this VPS, SQLite at `/root/.n8n/database.sqlite`).
- **Credentials:** load from `/root/claude-activity-logs/sops/credentials.md` — **never hardcode**.
- **Mikael alert phone:** `MIKAEL_ALERT_PHONE` env var on Vercel + local `.env` (set before P-07 activates; fall back to a DB column `system_operators.phone` if env missing).
- **Admin email:** `admin@bluewiseai.com` (Gmail OAuth primary, Mailgun fallback — pattern in `pages/api/admin/test-email.js`).
- **Existing:** `/root/n8n-webhook-healthcheck.sh` (7 webhooks, Slack alert, auto-restart). Sentinelle subsumes it at P-03.

## Universal SOPs (every prompt reads these)

1. `/root/bluewiseai-site/CLAUDE.md` — project conventions
2. `/root/claude-activity-logs/sops/credentials.md` — secrets
3. `/root/claude-activity-logs/sops/n8n/QUICK-REF.md` — when touching n8n
4. `/root/claude-activity-logs/sops/email-sending.md` — when sending email
5. `/root/claude-activity-logs/STATE.md` — current project state

## Universal constraints (every prompt enforces these)

- **NEVER** hardcode Supabase service key, API tokens, phone numbers, or email addresses in code. Always env vars or DB.
- **NEVER** query without `customer_id` filter on tenant-scoped tables (leads, messages, quotes, jobs, tasks, inbox_*).
- **NEVER** run `npm run dev/build` as a sanity check — too slow. Use `npx next build --no-lint` only on the final integration prompt (P-10).
- **NEVER** commit `.env*` files. Stage specific files by name, not `git add .`.
- **NEVER** create new tables without RLS enabled AND at least one policy (rule QUICK-REF #15).
- **ALWAYS** verify DB column names exist before `SELECT`/`INSERT` (rule QUICK-REF #16/#27).
- **ALWAYS** dual-write lessons to memory + SOP file (feedback_memory_sop_dual_write.md).

## Universal output contract (every prompt returns this XML block at end)

```xml
<result>
  <prompt_id>P-XX</prompt_id>
  <status>complete|blocked|partial</status>
  <artifacts>
    <file>path/to/file (created|modified)</file>
  </artifacts>
  <verified>
    <check>what was verified, with command/query and actual output</check>
  </verified>
  <handoff_notes>What the next prompt needs to know from this one.</handoff_notes>
  <blockers>Any unresolved issues that block the next prompt.</blockers>
</result>
```

---

# P-00 — DB schema + check registry seed

**Effort:** 30 min
**Dependencies:** none
**Agent type:** main session (Supabase MCP write access needed)

### SOPs to read FIRST
- `sops/credentials.md` (Supabase service key)
- `CLAUDE.md` (multi-tenant schema conventions)

### <context>
Sentinelle needs two persistent tables: one defining every check (the registry), one logging every execution (the event log). These tables must be queryable by the `/api/sentinelle/*` endpoints, the alert router, and the dashboard. Without this schema, no check has state, no alert has dedupe, no dashboard has history. This prompt creates them + seeds the 40+ check definitions.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
1. Create migration `supabase/migrations/YYYYMMDDHHMMSS_sentinelle_schema.sql` with:
   - `system_health_checks` table (registry).
   - `system_health_events` table (append-only log).
   - Both with RLS enabled + owner/admin policies.
   - Indexes: `events(check_id, created_at DESC)`, `events(state_changed, created_at DESC) WHERE state_changed`.
2. Apply via Supabase MCP (`mcp__supabase__apply_migration`) on project `xwhqkgsurssixjadzklb`.
3. Seed `system_health_checks` with 40+ rows. Use ONE `INSERT ... ON CONFLICT (id) DO UPDATE` so P-00 is idempotent.
4. Export a TypeScript/JS types file at `lib/sentinelle/types.js` mirroring the schema.

### Schema spec (exact)

```sql
CREATE TABLE IF NOT EXISTS system_health_checks (
  id            TEXT PRIMARY KEY,              -- 'n8n.active_count', 'telnyx.sms_delivery_24h'
  name          TEXT NOT NULL,                 -- human label
  category      TEXT NOT NULL CHECK (category IN ('n8n','api','db','external','infra','data_quality')),
  criticality   TEXT NOT NULL CHECK (criticality IN ('low','medium','high','critical')),
  interval_sec  INT  NOT NULL DEFAULT 300,     -- how often runner invokes it
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  baseline      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- thresholds, expected counts
  last_run_at   TIMESTAMPTZ,
  last_status   TEXT CHECK (last_status IN ('ok','warn','critical','error')),
  last_detail   TEXT,
  last_ms       INT,
  consecutive_failures INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_health_events (
  id             BIGSERIAL PRIMARY KEY,
  check_id       TEXT NOT NULL REFERENCES system_health_checks(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('ok','warn','critical','error')),
  detail         TEXT,
  ms             INT,
  state_changed  BOOLEAN NOT NULL DEFAULT FALSE,  -- true when status differs from previous event
  alerted        BOOLEAN NOT NULL DEFAULT FALSE,
  alert_channels JSONB DEFAULT '[]'::jsonb,       -- ['sms','email','voice']
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_she_check_time  ON system_health_events(check_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_she_state_change ON system_health_events(state_changed, created_at DESC) WHERE state_changed;

ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_events ENABLE ROW LEVEL SECURITY;

-- service role bypass; owner/admin read-only from dashboard
CREATE POLICY "owner_admin_read_checks" ON system_health_checks FOR SELECT
  USING (EXISTS (SELECT 1 FROM customer_users cu WHERE cu.user_id = auth.uid() AND cu.role IN ('owner','admin')));
CREATE POLICY "owner_admin_read_events" ON system_health_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM customer_users cu WHERE cu.user_id = auth.uid() AND cu.role IN ('owner','admin')));
```

### Seed list (40+ check ids — exact names, keep stable, they are referenced throughout the chain)

**n8n (10):** `n8n.active_count`, `n8n.error_rate_15m`, `n8n.webhook.universal-inbound`, `n8n.webhook.retell-tools`, `n8n.webhook.retell-post-call`, `n8n.webhook.retell-inbound-webhook`, `n8n.webhook.telnyx-master-voice-router-bw`, `n8n.webhook.bluewise-facebook-leads`, `n8n.pm2_running`, `n8n.sqlite_backups_fresh`

**api (8):** `api.health`, `api.overview`, `api.leads`, `api.inbox`, `api.calls`, `api.devis_render`, `vercel.last_build`, `vercel.function_errors_15m`

**db (6):** `db.connect`, `db.query_leads_ms`, `db.query_messages_ms`, `db.row_anomaly_leads`, `db.row_anomaly_messages`, `db.rls_policy_count`

**external (12):** `telnyx.account`, `telnyx.sms_delivery_24h`, `telnyx.voice_profile`, `mailgun.domain_verified`, `mailgun.spf_dkim_dmarc`, `mailgun.suppression_growth`, `gmail.oauth_token`, `retell.agent_list`, `retell.last_call_72h`, `openai.ping`, `stripe.account`, `groundwire.sip_registered`

**infra (4):** `infra.ssl_expiry`, `infra.dns_resolve`, `infra.domain_expiry`, `infra.vps_disk_ram`

**data_quality (6):** `dq.sms_outbound_status_null`, `dq.inbound_silence_24h`, `dq.leads_no_customer_id`, `dq.messages_orphan_lead_id`, `dq.jobs_no_lead_id`, `dq.contracts_payments_orphans`

Each row needs: `name` (human label FR or EN), `category`, `criticality` (low/medium/high/critical), `interval_sec` (default 300, some 900 or 3600 for expensive checks like SSL/DNS), `baseline` JSONB with relevant thresholds.

Criticality table (hardcode in seed):
- `critical`: `n8n.webhook.*`, `db.connect`, `api.health`, `telnyx.account`, `mailgun.domain_verified`, `dq.inbound_silence_24h`
- `high`: `n8n.active_count`, `n8n.error_rate_15m`, `telnyx.sms_delivery_24h`, `gmail.oauth_token`, `retell.agent_list`, `vercel.last_build`, `db.row_anomaly_*`, `dq.sms_outbound_status_null`
- `medium`: `api.*` (non-health), `external.*` (non-critical), `infra.ssl_expiry`, `db.query_*_ms`
- `low`: `n8n.sqlite_backups_fresh`, `infra.domain_expiry`, `mailgun.suppression_growth`

### <constraints>
- **NEVER** use `SERIAL` on `system_health_checks` — TEXT PK is stable and human-readable across env.
- **NEVER** skip RLS — rule QUICK-REF #15 (enabled + zero policies = fail-closed silent).
- **NEVER** forget the `customer_users` join in the read policy — Sentinelle is OWNER/ADMIN scope, not tenant-scoped.
- **NEVER** hardcode the seed in a migration file — seed runs idempotent via API or script so we can edit the registry later without a migration.
- **ALWAYS** set `interval_sec >= 60` (anti-overload).

### <thinking_required>
Before writing the migration, write inside `<thinking>` tags:
1. Which existing tables could conflict with these names? (grep for `system_health*`)
2. Does `customer_users.role` actually have owner/admin values in this project?
3. What index does `state_changed=true` need — partial or full?
4. Is the seed script idempotent under re-run?

### <output_format>
Return the universal `<result>` XML block with:
- `<file>supabase/migrations/..._sentinelle_schema.sql (created)</file>`
- `<file>scripts/sentinelle/seed-checks.mjs (created)</file>`
- `<file>lib/sentinelle/types.js (created)</file>`
- `<check>` entries for: migration applied (mcp output), 40+ rows inserted (COUNT query), RLS enabled (pg_tables), indexes present (pg_indexes).

### <verification>
- `SELECT COUNT(*) FROM system_health_checks;` must return ≥ 40.
- `SELECT DISTINCT category FROM system_health_checks;` must return exactly 6 values.
- `SELECT relrowsecurity FROM pg_class WHERE relname='system_health_checks';` → `t`.
- Re-run seed script → COUNT unchanged, no duplicate-key errors.

---

# P-01 — `/api/sentinelle/run-all` aggregator + response contract

**Effort:** 1h
**Dependencies:** P-00 complete
**Agent type:** main session

### SOPs to read FIRST
- `CLAUDE.md` (Pages Router, API shape)
- `sops/credentials.md`
- P-00 `lib/sentinelle/types.js`

### <context>
`run-all` is the single entry-point the n8n runner (P-07) calls every 5 min. It fans out to every enabled check in parallel, collects normalized results, computes `state_changed` vs the last event per check, writes one `system_health_events` row per check, and updates `last_*` columns on `system_health_checks`. Its output is the canonical snapshot the alert router (P-08) consumes.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
Create:
1. `pages/api/sentinelle/run-all.js` — POST endpoint. Protected by `SENTINELLE_SECRET` bearer token (Vercel env).
2. `lib/sentinelle/registry.js` — loads enabled checks from DB, returns array.
3. `lib/sentinelle/runner.js` — exports `runCheck(checkRow)` → `{id, status, detail, ms, error}`. Dispatches by `id` prefix (`n8n.*` → n8n module from P-03, `db.*` → P-02, etc.). Initially stubs every check to return `{status:'ok', detail:'stub'}` — real implementations come in P-02→P-06.
4. `lib/sentinelle/persist.js` — given a run result, writes `system_health_events` rows + updates `system_health_checks.last_*`. Computes `state_changed` by comparing `status` against the previous event's status for that check_id.
5. Response shape (return this exact JSON):

```json
{
  "run_id": "uuid-v4",
  "started_at": "2026-04-22T16:35:00.000Z",
  "duration_ms": 1234,
  "summary": {"ok": 40, "warn": 0, "critical": 0, "error": 0},
  "state_changes": [
    {"id": "n8n.active_count", "from": "ok", "to": "critical", "detail": "38/39 active (drift)"}
  ],
  "results": [
    {"id": "n8n.active_count", "status": "ok", "detail": "39/39", "ms": 120}
  ]
}
```

### <sops_excerpt>
- Use `createClient` from `@supabase/supabase-js` with service role key (server-side only).
- No authenticated user context — run-all is machine-to-machine via `SENTINELLE_SECRET`.
- Use `Promise.allSettled` for fan-out so one failing check doesn't kill the run.

### <constraints>
- **NEVER** block the response on external I/O more than 15 seconds — any check that overruns returns `{status:'error', detail:'timeout_15s'}` and the run continues.
- **NEVER** call `runCheck` serially — always `Promise.allSettled` in parallel batches of ≤ 20 concurrent (avoid rate limits on external APIs).
- **NEVER** leak the `SENTINELLE_SECRET` in error responses or logs.
- **ALWAYS** return HTTP 200 even if checks inside failed — only 401/500 for auth/system errors (so the runner can parse summary regardless).

### <thinking_required>
Before writing the endpoint, write inside `<thinking>`:
1. How will P-02→P-06 plug into `lib/sentinelle/runner.js` — dynamic import by category, or static require tree?
2. What's the right timeout per check? Some (SSL WHOIS) need 10s+, some (DB ping) should fail at 1s.
3. How do we compute `state_changed` efficiently? One query per check or a batched window function?

### <output_format>
Universal `<result>` with:
- Files created (list).
- `<check>` entries: curl run-all returns 200 with the contract shape; all 40+ check stubs return `ok`; `system_health_events` grew by 40+ rows; `state_changes` is `[]` on second run (no change because stubs are deterministic).

### <verification>
- `curl -X POST -H "Authorization: Bearer $SENTINELLE_SECRET" https://<vercel>/api/sentinelle/run-all | jq .summary` → `{"ok":40,"warn":0,"critical":0,"error":0}`.
- Run twice within 60s → second response has `state_changes: []`.
- Run without auth → 401.
- Run with one check disabled (`UPDATE system_health_checks SET enabled=false WHERE id='openai.ping'`) → summary count drops by 1.

---

# P-02 — Supabase + Next.js self-check module

**Effort:** 1h
**Dependencies:** P-01
**Agent type:** main session

### SOPs to read FIRST
- `CLAUDE.md` (multi-tenant query conventions)
- `sops/credentials.md`

### <context>
Covers 14 check ids: all `db.*` (6) + all `api.*` (8). These are the fast, cheap, always-on checks — they must complete in < 5s total. If Supabase is slow or down, Sentinelle must know before users do.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
Extend `lib/sentinelle/runner.js` dispatcher with real implementations:

**db.connect** — open a Supabase client, `SELECT 1` via RPC or REST. `ok` if < 1000ms, `warn` 1000-3000ms, `critical` > 3000ms or error.

**db.query_leads_ms** — `SELECT count(*) FROM leads LIMIT 1`. Thresholds: ok < 500ms, warn 500-1500, critical > 1500.

**db.query_messages_ms** — same pattern on `messages`.

**db.row_anomaly_leads** — compare current count against `baseline.expected_range` in the check row. warn if ±30%, critical if ±60%. Baseline must be refreshable (expose helper endpoint in P-10 chaos tests).

**db.row_anomaly_messages** — same.

**db.rls_policy_count** — query `pg_policies` count, compare to `baseline.expected`. critical if drops (policies deleted = data leak risk).

**api.health** — GET `/api/health` on our own Vercel URL (first request from this endpoint, so it's self-referential via env `VERCEL_URL`). 200 required. Build `/api/health` in this prompt if it doesn't exist: returns `{ok:true, ts:ISO, build_id: process.env.VERCEL_GIT_COMMIT_SHA}`.

**api.overview / api.leads / api.inbox / api.calls / api.devis_render** — HEAD (or GET with minimal query) on the respective endpoints using a dedicated `SENTINELLE_TEST_USER` credential OR skip auth by testing a public route. For endpoints requiring auth, use a service-role Supabase session to mint a JWT for a dedicated system user row in `auth.users` (create in migration P-00 addendum).

**vercel.last_build** — Vercel REST API `GET /v6/deployments?projectId=...&limit=1`. `ok` if `readyState=READY`, `warn` if `BUILDING`, `critical` if `ERROR` or last-success > 24h ago.

**vercel.function_errors_15m** — Vercel Log Drain API or `/logs` endpoint for last 15 min. Count errors. `ok` if < 5, `warn` 5-20, `critical` > 20.

### <constraints>
- **NEVER** use a hardcoded URL like `https://bluewiseai.com` — use `process.env.VERCEL_URL` or `process.env.SITE_URL` so dev/preview/prod all work.
- **NEVER** create a new `auth.users` row without a corresponding `customer_users` row pinning role to a sandbox tenant — isolation rule.
- **NEVER** return `{status:'ok'}` on a query error swallowed by try/catch — propagate the real failure as `error` status.
- **ALWAYS** include `ms` in the return so the dashboard can sparkline latency.

### <thinking_required>
Before coding, think through inside `<thinking>`:
1. Do we need a dedicated system tenant (cid=0 or cid=-1) for the Sentinelle test user, or is it safe to use an existing one?
2. What's the minimal query on `/api/overview` that doesn't hit expensive aggregations?
3. Vercel function errors API — do we have credentials for Vercel API in `credentials.md`? If not, this check must ship disabled with a NOT_CONFIGURED status.

### <output_format>
Universal `<result>` + for each check id a `<check>` entry in `<verified>` showing the live call output and the status computed.

### <verification>
- Full run-all call → all 14 checks return real data, no stubs.
- Manually stop Supabase connectivity (firewall sim: block the hostname in /etc/hosts) → `db.connect` returns `critical`.
- Rollback.
- Rename an RLS policy → `db.rls_policy_count` shifts baseline → warn/critical as configured.

---

# P-03 — n8n module (subsumes existing bash script)

**Effort:** 1.5h
**Dependencies:** P-01, P-02
**Agent type:** main session

### SOPs to read FIRST
- `sops/n8n/QUICK-REF.md` (MANDATORY per PreToolUse hook)
- `/root/n8n-webhook-healthcheck.sh` (existing script — read before replacing)
- `/root/n8n-webhook-reregister.sh`

### <context>
Covers all 10 `n8n.*` check ids. Replaces the existing cron bash script at `/root/n8n-webhook-healthcheck.sh` (7 webhooks, Slack-only alert, aggressive pm2 auto-restart). New behavior: observation first, automation second — report state, escalate alerts via Sentinelle alert router (P-08), and only trigger restart if 3 consecutive failures AND `baseline.auto_restart=true`.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
1. Create `lib/sentinelle/checks/n8n.js` exporting `runN8nCheck(checkId, checkRow)`.
2. Implement the 10 n8n checks:

**n8n.active_count** — `GET /api/v1/workflows?active=true` via `N8N_API_KEY`. Compare count vs `baseline.expected` (initial value: seed from live count at P-00). Drift = warn, drop > 20% = critical.

**n8n.error_rate_15m** — `GET /api/v1/executions?status=error&limit=100` windowed to last 15 min + `GET /api/v1/executions?limit=100`. Rate ≥ 10% = warn, ≥ 25% = critical.

**n8n.webhook.<path>** — POST empty body to `https://automation.bluewiseai.com/webhook/<path>` with 5s timeout. `ok` on 200/400/403/405 (alive and rejecting), `critical` on 404/000/timeout. Reuse the 7 webhook paths from the existing script — add more if QUICK-REF registry expanded.

**n8n.pm2_running** — via SSH-less local exec (this runs on Vercel, not the VPS). Alternative: call a tiny authenticated endpoint on the VPS that shells out to `pm2 jlist`. Since Vercel can't SSH, ship this check as `NOT_IMPLEMENTED_ON_VERCEL` status initially, and add a companion systemd/cron job on the VPS at P-10 that POSTs pm2 status to `/api/sentinelle/ingest-vps` every 60s. Sentinelle reads the latest row from a `system_health_vps_pings` table.

**n8n.sqlite_backups_fresh** — Same VPS-pinged pattern: cron on VPS posts latest backup mtime. Sentinelle flags critical if > 48h old.

3. Create VPS sidecar script `scripts/sentinelle/vps-sidecar.sh`:
   - Runs every 60s via cron (`* * * * *`).
   - Collects: `pm2 jlist` parsed, disk usage `df -h /`, RAM `free -m`, n8n sqlite mtime on `/root/.n8n/database.sqlite`, latest backup mtime in `~/n8n-backups/`.
   - POSTs to `/api/sentinelle/ingest-vps` with `SENTINELLE_SECRET` bearer.

4. Create `pages/api/sentinelle/ingest-vps.js` — accepts VPS payload, writes to `system_health_vps_pings` table (schema addendum in this prompt).

5. **Retire** `/root/n8n-webhook-healthcheck.sh`: comment out the crontab line, leave the script in place with a big `# DEPRECATED 2026-04-22, replaced by Sentinelle P-03` header. Do NOT delete — rollback safety for 7 days.

6. Migration addendum: `system_health_vps_pings(id, host, collected_at, payload JSONB, created_at)`.

### <constraints>
- **NEVER** skip re-registering webhooks after a Sentinelle-triggered pm2 restart (rule QUICK-REF #20 — if auto-restart is enabled, always run `n8n-webhook-reregister.sh` after).
- **NEVER** auto-restart without 3 consecutive `critical` states — avoid restart storm.
- **NEVER** hardcode webhook paths in `n8n.js` — read them from `baseline.path` on each `n8n.webhook.*` check row.
- **NEVER** delete the old bash script in this prompt — deprecation period is 7 days.
- **ALWAYS** record the pre-restart state (active workflows, error rate) into `system_health_events.detail` JSON on any restart attempt so we can forensics later.

### <thinking_required>
Inside `<thinking>`:
1. The existing script auto-restarts pm2 on webhook 404. Is that still what we want, or is it masking real bugs? Memory rule: "root cause over quick fix" — I lean toward observation-only restart after 3× confirmed CRITICAL.
2. Which 7 webhooks are in the existing script vs what's in QUICK-REF workflows-registry — make the seed registry match both.
3. The VPS sidecar authenticates with SENTINELLE_SECRET — same secret as Vercel env. Is there a rotation plan?

### <output_format>
Universal `<result>` + specific `<check>` entries showing:
- `curl` output against each webhook returning real code.
- Active workflow count matches between Sentinelle call and direct n8n API call.
- Old crontab line commented out (`crontab -l` output before/after).

### <verification>
- Disable one active workflow manually → `n8n.active_count` flips to `warn/critical` within 5 min.
- Re-enable → flips back to `ok` on next run.
- Curl a deliberately bad webhook path → that check returns `critical`.
- VPS sidecar runs for 10 min → `system_health_vps_pings` has ≥ 10 rows.

---

# P-04 — External services module

**Effort:** 2h
**Dependencies:** P-01
**Agent type:** main session

### SOPs to read FIRST
- `sops/credentials.md` (Telnyx, Mailgun, Gmail OAuth, Retell, OpenAI, Stripe, Groundwire)
- `sops/email-sending.md` (Gmail/Mailgun fallback pattern)

### <context>
Covers all 12 `external.*` check ids. These are third-party dependencies — if Telnyx or Mailgun or Retell has an outage, Mikael must know within 5 min so he can post a status message to clients instead of silently losing leads/replies. Memory incident: Mailgun API key rotated 2026-03-23 but Vercel env not updated for 138 days — this module prevents that class of bug.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
Create `lib/sentinelle/checks/external.js` with:

**telnyx.account** — `GET https://api.telnyx.com/v2/account` with `TELNYX_API_KEY`. 200 = ok, 401 = critical (key rotated without env update), 5xx = warn.

**telnyx.sms_delivery_24h** — Query Telnyx MDR `GET /v2/detail_records?filter[record_type]=message&filter[created_at][gte]=<24h_ago>`. Compute `delivered / (delivered + failed)`. ok ≥ 95%, warn 85-95%, critical < 85%.

**telnyx.voice_profile** — `GET /v2/outbound_voice_profiles` — ensure configured profile exists and enabled.

**mailgun.domain_verified** — `GET https://api.mailgun.net/v3/domains/<domain>` with Mailgun key. Check `state=active` AND `require_tls=true`.

**mailgun.spf_dkim_dmarc** — same domain endpoint returns `sending_dns_records[]`. Verify SPF, DKIM, DMARC all have `valid=valid`. Any invalid = critical.

**mailgun.suppression_growth** — `GET /v3/<domain>/bounces` count + `/unsubscribes` count + `/complaints` count. Alert if growth > baseline/day (warn 2×, critical 5×).

**gmail.oauth_token** — attempt token refresh using stored refresh token (same pattern as `pages/api/admin/test-email.js`). Success = ok, 400/401 from Google = critical (token revoked, Mikael must re-auth).

**retell.agent_list** — `GET https://api.retellai.com/v2/list-agents` with Retell API key. Count ≥ 1 = ok, 0 = warn, error = critical.

**retell.last_call_72h** — `POST /v2/list-calls` with `filter_criteria: {}` (all), look at most-recent. If > 72h ago = warn, > 7d = critical (voice flow may have silently broken).

**openai.ping** — `POST /v1/chat/completions` minimal payload (`gpt-5-nano`, 1 token) with `OPENAI_API_KEY`. Success = ok.

**stripe.account** — `GET https://api.stripe.com/v1/account` with secret key. `charges_enabled=true` AND `payouts_enabled=true` = ok, any false = warn.

**groundwire.sip_registered** — Check via Telnyx SIP connection status API if available, else document as `NOT_IMPLEMENTED` with a fallback: look at successful outbound voice calls in last 24h (if > 0, SIP was working at least once).

### <constraints>
- **NEVER** include the full API key in `detail` on error — only the first 6 chars (for rotation diff detection).
- **NEVER** call an external API more than once per check per run — timeouts must be ≤ 10s.
- **NEVER** ship a check without documenting which credential env var it consumes (inline JSDoc + README update).
- **ALWAYS** on 401 from any external: include `detail: "auth_failed_key_starts_${firstSix}"` so rotation incidents are obvious in the event log.

### <thinking_required>
Inside `<thinking>`:
1. For `telnyx.sms_delivery_24h` — the MDR API paginates, what's the cost of pulling 24h of records? Consider sampling the last 100.
2. For `gmail.oauth_token` — which Gmail user? BW has multiple tenants each with their own refresh token. Loop per tenant or only the BW-primary?
3. For `mailgun.suppression_growth` — baseline needs training (observe 7d median before alerting). Document this in `baseline` JSONB.

### <output_format>
Universal `<result>` with `<check>` entries showing live call output for each of the 12 services (redact keys per constraint above).

### <verification>
- Live run → all 12 checks return real status.
- Temporarily break Telnyx key in Vercel env (replace last char with `x`) → `telnyx.account` returns `critical` within 5 min, `detail` includes `KT_..._x` hash pattern. Restore.
- Confirm no API key leaked in any `system_health_events.detail` column.

---

# P-05 — SSL / DNS / domain expiry module

**Effort:** 45 min
**Dependencies:** P-01
**Agent type:** main session

### SOPs to read FIRST
- `sops/namecheap-dns.md`
- `sops/credentials.md` (Namecheap API if available)

### <context>
Covers 4 `infra.*` check ids. SSL cert expiry is the classic silent-death bug — a domain's HTTPS breaks at 00:00 on day X and every API call starts failing. Sentinelle alerts 14 days ahead so rotation is calm. Same for domain registration expiry (Namecheap).

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
Create `lib/sentinelle/checks/infra.js`:

**infra.ssl_expiry** — for each domain in `baseline.domains[]`, establish TLS connection (Node `tls.connect` or `openssl s_client -connect <host>:443 </dev/null 2>/dev/null | openssl x509 -noout -enddate` via child_process), parse `notAfter`. Thresholds: warn < 14 days, critical < 3 days.

Domains to check (seed in `baseline.domains`):
- `bluewiseai.com`, `crm.bluewiseai.com`, `automation.bluewiseai.com`
- `pur-construction-site.vercel.app`, `pur.construction` (if live)
- `serviceplus.plus`, `www.serviceplus.plus`
- `naloutshine.com` (if managed)

**infra.dns_resolve** — for each domain + each required record type (A, MX, TXT/SPF, TXT/DMARC, TXT/DKIM), do a DNS lookup via Node `dns/promises`. Any NXDOMAIN/SERVFAIL = critical, any unexpected record content = warn.

**infra.domain_expiry** — Namecheap API (`namecheap.domains.getList`) — check `Expires` date. Warn < 30d, critical < 7d.

**infra.vps_disk_ram** — reads from `system_health_vps_pings` latest row (populated by P-03 sidecar). Alert: disk > 85% = warn, > 95% = critical; RAM free < 200 MB = warn, < 50 MB = critical.

### <constraints>
- **NEVER** use a public cert-checker service (sslshopper, ssllabs) — they rate-limit and introduce an external dependency; use local TLS handshake.
- **NEVER** assume Namecheap API works — if call returns `!Error!`, degrade gracefully to `NOT_IMPLEMENTED` with a heads-up in `detail`.
- **NEVER** hardcode domain list — read from `baseline.domains` so ops can add a tenant domain without code changes.
- **ALWAYS** store parsed expiry timestamp in `detail` so dashboard can render a countdown.

### <thinking_required>
Inside `<thinking>`:
1. Node `tls.connect` on Vercel edge — will timeout on cold start? Move this check to longer interval (900s or 3600s) since cert expiry doesn't change minute-to-minute.
2. Namecheap — credentials in SOP? If not, ship as disabled with TODO.

### <output_format>
Universal `<result>` + `<check>` entries per domain with parsed expiry date + days remaining.

### <verification>
- Run check → each domain returns its actual `notAfter` date. Days remaining matches manual `openssl s_client` result.
- Simulate impending expiry by temp-setting `baseline.warn_days=9999` on one domain → check flips to `warn`. Restore.

---

# P-06 — Data-quality module

**Effort:** 1h
**Dependencies:** P-01, P-02
**Agent type:** main session

### SOPs to read FIRST
- `CLAUDE.md` (schema rules — `inbox_messages.lead_id → inbox_leads.id`, `inbox_leads.customer_id` is STRING)
- `sops/check-before-proposing.md` if exists

### <context>
Covers 6 `dq.*` check ids. These find broken data the code doesn't know about — orphans, silent failures, isolation leaks. Memory incident: 2 outbound SMS today with `status=null` (Telnyx never confirmed delivery). Sentinelle catches that class of bug at 30-min resolution.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
Create `lib/sentinelle/checks/data_quality.js`:

**dq.sms_outbound_status_null** — `SELECT count(*) FROM messages WHERE direction='outbound' AND channel='sms' AND status IS NULL AND created_at < NOW() - INTERVAL '30 minutes';`. warn ≥ 1, critical ≥ 5. `detail` lists up to 5 ids.

**dq.inbound_silence_24h** — For each active tenant (SELECT DISTINCT `customer_id` FROM `messages` WHERE created_at > NOW() - INTERVAL '7 days'), count inbound SMS last 24h. If 0 AND tenant averaged ≥ 1/day over last 7d → `warn`. `detail` names the tenants.

**dq.leads_no_customer_id** — `SELECT count(*) FROM leads WHERE customer_id IS NULL;`. Must be 0. Any > 0 = `critical` (isolation leak).

**dq.messages_orphan_lead_id** — `SELECT count(*) FROM inbox_messages im LEFT JOIN inbox_leads il ON il.id = im.lead_id WHERE im.lead_id IS NOT NULL AND il.id IS NULL;`. Must be 0, any > 0 = `critical` (FK not enforced by schema but invariant expected).

**dq.jobs_no_lead_id** — `SELECT count(*) FROM jobs WHERE lead_id IS NULL;`. warn > 0, critical > 5.

**dq.contracts_payments_orphans** — `SELECT count(*) FROM contracts c LEFT JOIN jobs j ON j.id=c.job_id WHERE j.id IS NULL;` AND `SELECT count(*) FROM payments p LEFT JOIN jobs j ON j.id=p.job_id WHERE j.id IS NULL;`. Any orphan = critical.

### <constraints>
- **NEVER** run an unbounded `SELECT *` — always aggregate with `count(*)` or limit detail examples to 5.
- **NEVER** skip the tenant-scope filter on non-global tables — data_quality queries cross tenants on purpose, mark them clearly.
- **NEVER** ship a check that requires a new column without a migration.
- **ALWAYS** return count in `detail` (so dashboard shows "3 orphans" not just "critical").

### <thinking_required>
Inside `<thinking>`:
1. `inbox_leads.customer_id` is STRING per CLAUDE.md — confirm the join type on `dq.messages_orphan_lead_id` is correct.
2. How fast does `LEFT JOIN` run on `inbox_messages` if it has 100k+ rows? Add `created_at > NOW() - INTERVAL '30 days'` if needed.
3. `active tenant` definition — last 7 days activity or tenants with `is_active=true` flag? Confirm column exists.

### <output_format>
Universal `<result>` with `<check>` entries showing actual row counts for each DQ query.

### <verification>
- Current live run → exact counts match manual `SELECT COUNT(*)` queries against Supabase.
- Simulate: insert a fake orphan (temporary) → check flips critical. Delete. Flips ok.

---

# P-07 — n8n Sentinelle runner workflow

**Effort:** 1.5h
**Dependencies:** P-01 through P-06 all complete
**Agent type:** main session with n8n MCP access

### SOPs to read FIRST
- `sops/n8n/QUICK-REF.md` (MANDATORY)
- `sops/n8n/errors-*.md` as needed
- `sops/n8n/workflows-registry.md`

### <context>
This is the driver — one n8n workflow that runs every 5 min, calls `/api/sentinelle/run-all`, receives the state-changes array, and triggers the alert router (P-08) for any critical/warn change. Without this, the whole chain is dormant.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>
Create new n8n workflow `Sentinelle Runner` with:

1. **Schedule Trigger** — every 5 minutes, interval node (Cron: `*/5 * * * *`).
2. **HTTP Request** — `POST https://<vercel-prod>/api/sentinelle/run-all` with `Authorization: Bearer {{$env.SENTINELLE_SECRET}}`, 20s timeout.
3. **Code — Parse run** — extracts `state_changes` array, enriches each with `check` row data (fetch via HTTP GET `/api/sentinelle/checks/<id>`).
4. **IF — Any state changes?** — IF count($json.state_changes) > 0 → branch to alert, ELSE → log summary + end.
5. **Split In Batches (loop)** — one alert dispatch per state change (avoids alert aggregation bugs at this layer — aggregation happens in P-08).
6. **HTTP Request — Alert Router** — POST to `/api/sentinelle/alert` with `{check_id, from, to, detail, criticality}`.
7. **Postgres — Log run** — INSERT one row per run into `system_health_runs(id, started_at, duration_ms, summary, alerted_count)`.

Migration addendum in this prompt: `system_health_runs(id bigserial, started_at timestamptz, duration_ms int, summary jsonb, alerted_count int, created_at timestamptz default now())`.

Workflow save sequence (SOP-compliant):
- MCP `create_workflow` → get ID.
- MCP partial updates for each node.
- Verify via `validate_workflow` MCP (not enough — also test execute).
- Manually execute once via MCP `trigger_workflow` — confirm 200 response + correct branching.
- Activate with `activate_workflow` MCP (schedule trigger will start ticking).

### <constraints>
- **NEVER** use Switch v3 (rule QUICK-REF #5 — use Code node + IF chain).
- **NEVER** use `$json` after Postgres INSERT (rule #7 — use `$('Previous Node').first().json`).
- **NEVER** use `n8n_update_full_workflow` (rule #1).
- **NEVER** skip test execution before activating — seed a deliberately flipping check to verify alert branch fires.
- **ALWAYS** set `alwaysOutputData: true` on any Postgres node feeding a downstream node (rule #22).
- **ALWAYS** name nodes in English (consistency with existing workflows).

### <thinking_required>
Inside `<thinking>`:
1. Should Runner call `/run-all` itself or should there be a lightweight scheduler in Next.js? Decision: n8n for visibility (failed runs show up in n8n executions UI alongside other workflows).
2. What if `/run-all` itself times out? Add a retry: 1 retry with 30s backoff, then log the run as `failed` without alerting (avoids false positive during Vercel cold start).
3. Dedupe per state change is handled in P-08 — this workflow just forwards everything.

### <output_format>
Universal `<result>` with n8n workflow id, activation status, and a 15-min sample showing ≥ 3 successful executions in the n8n executions UI.

### <verification>
- After activation, `GET /api/v1/executions?workflowId=<SentinelleRunnerId>` returns 3+ runs within 15 min, all `status=success`.
- Seed a check to `critical` manually (`UPDATE system_health_checks SET last_status='critical' WHERE id='openai.ping'`; reset actual OpenAI check to ok) — next run detects state change `critical → ok` and forwards to alert router.
- System_health_runs has ≥ 3 rows.

---

# P-08 — Alert router + anti-spam + voice escalation

**Effort:** 1.5h
**Dependencies:** P-07
**Agent type:** main session with n8n MCP

### SOPs to read FIRST
- `sops/n8n/QUICK-REF.md` (MANDATORY)
- `sops/retell/QUICK-REF.md` (for outbound call)
- `sops/email-sending.md`
- `sops/credentials.md`

### <context>
All alerts funnel through `/api/sentinelle/alert` → n8n workflow `Sentinelle Alert Router` which enforces:
1. Dedupe: same `check_id` within 1h → skip (unless the new status is MORE severe).
2. Channels by criticality: `low/medium` = email only; `high` = SMS + email; `critical` = SMS + email + voice call (Retell) if still `critical` after 30 min.
3. Digest: if ≥ 3 alerts in 5 min, group into one SMS/email digest instead of spamming.
4. Recovery: `X → ok` always sends an "all good" message (one per state change, no dedupe).

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>

1. Create `pages/api/sentinelle/alert.js` — accepts `{check_id, from, to, detail, criticality}`, computes dedupe from `system_health_events`, inserts a row, forwards to n8n webhook `sentinelle-alert` if not deduped.

2. Create n8n workflow `Sentinelle Alert Router`:
   - **Webhook Trigger** on path `sentinelle-alert`.
   - **Code — Decide channels** — maps criticality + state to channels array.
   - **Split (Code with IF chain per rule #5)** — branches to SMS, Email, Voice based on channels.
   - **HTTP — Telnyx SMS** — `POST /v2/messages` to `MIKAEL_ALERT_PHONE` (env).
   - **HTTP — Mailgun** — to `admin@bluewiseai.com` with formatted HTML (subject: `[Sentinelle ${to.upper()}] ${check_name}`, body: detail + dashboard link).
   - **Wait 30 min** — only on `critical` branch.
   - **HTTP — Re-check** — GET `/api/sentinelle/checks/<id>` — if still critical, fire voice escalation.
   - **HTTP — Retell outbound call** — `POST /v2/create-phone-call` with Mikael phone, agent that reads the alert.

3. Create Retell agent `Sentinelle Escalation` (once per chain, not per alert):
   - System prompt: "You are calling Mikael because a CRITICAL system alert has been unresolved for 30 minutes. Read the check name, the failure detail, and ask him to acknowledge by saying 'ok j'ai compris'. If no acknowledgment after 3 attempts, end politely."
   - Configured to receive alert content via variable injection at call time.

4. Digest logic in `alert.js`: when inserting, query `SELECT count(*) FROM system_health_events WHERE created_at > NOW() - INTERVAL '5 minutes' AND state_changed=true`. If ≥ 3, pass `{digest: true, combined: [...]}` to Router and Router formats one grouped message instead.

### <constraints>
- **NEVER** call Telnyx/Mailgun directly from `alert.js` — always route through n8n so alert history is in n8n executions UI for forensics.
- **NEVER** skip the dedupe query — memory incident prevention (don't wake Mikael 47× in one night).
- **NEVER** escalate to voice for non-critical alerts.
- **NEVER** use raw string concatenation for SMS body (Telnyx character limits) — templated with a length cap at 140 chars for SMS, unlimited for email.
- **ALWAYS** include a dashboard link (`https://<prod>/platform/sentinelle?check=<id>`) in every alert message.

### <thinking_required>
Inside `<thinking>`:
1. 30-min wait in n8n — the Wait node is OK but if the n8n process restarts, resumption can be flaky. Prefer storing the pending-escalation in a table and a separate 1-min workflow that checks `system_health_escalations(created_at < NOW() - INTERVAL '30 minutes' AND status='pending')`.
2. Retell agent creation — do we have an existing "Mikael personal" agent, or create a new one? Keep it dedicated to Sentinelle for isolation.
3. What's the SMS template? Short, actionable: "[Sentinelle CRIT] n8n.webhook.universal-inbound: 404 for 10min. Dashboard: <url>".

### <output_format>
Universal `<result>` + `<check>` for each: dedupe query returns correct counts, SMS/email test delivered, escalation flow end-to-end verified.

### <verification>
- Seed a critical state change → Mikael receives ONE SMS + ONE email within 2 min.
- Seed same check critical again within 1h → no new SMS/email (dedupe works).
- Seed a different critical → new SMS/email.
- Seed 4 different critical within 5 min → one digest SMS with all 4 summarized.
- Leave one critical unresolved → voice call placed exactly 30 min later.
- `X → ok` recovery → one "resolved" message sent.

---

# P-09 — Dashboard `/platform/sentinelle`

**Effort:** 2–3h
**Dependencies:** P-00 through P-08
**Agent type:** main session

### SOPs to read FIRST
- `CLAUDE.md` (Tailwind + DashboardLayout pattern)
- P-00 schema
- existing `pages/platform/overview.js` for layout parity

### <context>
Live visual of the whole system. Grid of tiles per category, each tile green/amber/red, with last-run timestamp, sparkline of latency, click-through to event history. Protected: `owner` or `admin` role via `customer_users`.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>

1. `pages/platform/sentinelle/index.js` — main grid.
2. `pages/platform/sentinelle/[id].js` — detail view per check (24h event log, sparkline, threshold editor).
3. `pages/api/sentinelle/checks.js` — GET all, JSON for dashboard consumption.
4. `pages/api/sentinelle/events.js?check_id=...&hours=24` — returns events for one check.
5. `src/components/sentinelle/StatusTile.js` — green/amber/red tile.
6. `src/components/sentinelle/Sparkline.js` — tiny latency chart (inline SVG, no chart lib).
7. Auto-refresh every 30s via `setInterval` + SWR.
8. Filters: category (all/n8n/api/db/external/infra/data_quality), criticality (all/critical/high/medium/low).
9. Header stats: "X checks OK / Y warn / Z critical" + last run timestamp + total runs today.

### <constraints>
- **NEVER** add a chart library (chart.js, recharts) — inline SVG sparkline only, per project convention.
- **NEVER** poll `/api/sentinelle/run-all` from the dashboard — only read from `system_health_checks.last_*` columns.
- **NEVER** use `any` types or skip null-guards on `last_ms` / `last_detail`.
- **NEVER** expose this page to non-admin roles — enforce at the API layer AND page layer.
- **ALWAYS** include an "Acknowledge" button on critical tiles (writes `system_health_events.acknowledged=true` + `acknowledged_by user_id, acknowledged_at NOW()` — schema addendum in this prompt).

### <thinking_required>
Inside `<thinking>`:
1. Auto-refresh cadence 30s — is that too aggressive with 40+ checks each with their own row? Test query cost; add a single `?format=dashboard` endpoint that returns all data in one call.
2. Acknowledged state interacts with alert dedupe — if Mikael ACKs a critical from dashboard, does alert router respect the ACK? Yes — add `WHERE acknowledged=false` to alert router's dedupe query. Document in P-08 addendum.
3. Mobile-first layout — Mikael reads this on phone at 2am. Tiles must stack cleanly at <640px.

### <output_format>
Universal `<result>` + `<check>`: page loads < 2s on cold, auto-refresh fires without 5xx, all 40+ tiles render with real statuses.

### <verification>
- Open page → all 40+ tiles render with live state.
- Click a critical tile → detail page shows 24h event history + sparkline.
- Click "Acknowledge" → tile visually marks ACK'd, alert router dedupe respects it (no new SMS until state changes).
- Visit as non-admin user → 403/redirect.
- Mobile viewport (375px) → tiles stack, no overflow.

---

# P-10 — Chaos tests + memory/SOP dual-write

**Effort:** 1h (tests) + 30 min (dual-write)
**Dependencies:** P-00 through P-09 all complete and live in prod
**Agent type:** main session

### SOPs to read FIRST
- `sops/prompt-architect.md` (dual-write meta-rule)
- `feedback_memory_sop_dual_write.md`
- `feedback_test_keys_before_declaring_dead.md`

### <context>
Verify the whole chain works end-to-end by deliberately breaking 10 things and confirming Sentinelle catches each within its interval + sends the correct alert. Without this, we shipped a monitoring system that has never been observed monitoring anything real. Then dual-write lessons learned.

Credentials: Load from `/root/claude-activity-logs/sops/credentials.md`.

### <task>

**Chaos script `scripts/sentinelle/chaos-test.mjs`:**

For each scenario, arm the break, wait interval + 60s, verify detection + alert + recovery.

1. Disable one active n8n workflow (any low-criticality one) → `n8n.active_count` drops → warn fires.
2. Temporarily stop the universal-inbound webhook (rename in n8n) → `n8n.webhook.universal-inbound` critical.
3. Revoke Telnyx test key (switch env var to invalid) → `telnyx.account` critical.
4. Point `SUPABASE_URL` to a bad host (local override) → `db.connect` critical.
5. Insert a fake lead with `customer_id=NULL` → `dq.leads_no_customer_id` critical.
6. Insert a fake outbound SMS with `status=NULL` and `created_at=NOW()-31min` → `dq.sms_outbound_status_null` warn.
7. Delete an RLS policy on `leads` → `db.rls_policy_count` critical.
8. Manipulate SSL check `baseline.warn_days=9999` → ssl critical.
9. Block Mailgun domain state (or toggle require_tls=false via API) → `mailgun.domain_verified` warn.
10. Simulate Vercel failed build — if no real bad deploy, mock by setting baseline.expected_last_build_age=0.

**For each:** verify
- Event row inserted with correct `status`, `state_changed=true`.
- Alert sent (check SMS inbox + email inbox + n8n Alert Router execution).
- Dedupe respected if re-armed within 1h.
- Recovery message on restore.

**Memory dual-write:**
Write new memory entries to `/root/.claude/projects/-root-bluewiseai-site/memory/`:
- `feedback_sentinelle_chaos_tested.md` — chain tested live, false-positive rate, lessons on thresholds.
- `project_sentinelle_live.md` — architecture, check ids, runbook link.

**SOP dual-write:**
- `sops/sentinelle.md` — NEW file: architecture, check registry, how to add a new check, how to edit thresholds, alert matrix, chaos test procedure.
- `sops/n8n/workflows-registry.md` — add Sentinelle Runner + Alert Router entries.
- `sops/credentials.md` — add `SENTINELLE_SECRET`, `MIKAEL_ALERT_PHONE` entries with rotation procedure.
- `STATE.md` — update session log entry: P-00→P-10 shipped, N commits, waste %, Mikael corrections.

### <constraints>
- **NEVER** run chaos tests in production without rollback steps written FIRST and rehearsed locally. Every scenario has a `arm()` and `restore()` function.
- **NEVER** skip the recovery verification — detection without recovery is half the job.
- **NEVER** shortcut the dual-write to memory only — rule locked 2026-04-20.
- **ALWAYS** run chaos in a controlled window, ideally off-hours, and announce via Slack #sor1 before starting.

### <thinking_required>
Inside `<thinking>`:
1. Production-safe scenarios only — don't disable universal-inbound at 2pm when leads are arriving. Use off-hour window.
2. Some scenarios require VPS shell access (disable workflow, change env) — document the exact command.
3. False-positive baselines — after 7d of running, revisit seed `baseline` values that tripped needlessly.

### <output_format>
Universal `<result>` with:
- `<artifact>scripts/sentinelle/chaos-test.mjs (created)</artifact>`
- `<artifact>sops/sentinelle.md (created)</artifact>`
- `<artifact>memory/feedback_sentinelle_chaos_tested.md (created)</artifact>`
- `<artifact>memory/project_sentinelle_live.md (created)</artifact>`
- `<check>` per scenario: armed, detected within X seconds, alert received, restored, recovery message received.

### <verification>
- 10/10 chaos scenarios pass detection + alert + recovery.
- Memory and SOPs updated — `ls` outputs confirm new files + correct entries in MEMORY.md.
- STATE.md session log entry written.
- Re-run chaos script end-to-end twice — same 10/10 pass rate (reproducible).

---

# Execution order & gates

```
P-00  DB schema + seed          [gate: COUNT(*)>=40, RLS enabled, idempotent seed]
  ↓
P-01  /run-all aggregator       [gate: 40 stubs → ok; state_changes=[] on 2nd run]
  ↓
P-02  db + api checks           [gate: 14 checks live; chaos DB down flips critical]
  ↓
P-03  n8n module                [gate: 10 checks; VPS sidecar pings; old bash script deprecated]
  ↓
P-04  external services         [gate: 12 checks live; chaos Telnyx key flips critical]
  ↓
P-05  ssl/dns/domain            [gate: 4 checks live; parsed notAfter matches openssl]
  ↓
P-06  data quality              [gate: 6 checks live; orphan injection flips critical]
  ↓
P-07  n8n Runner workflow       [gate: 3+ successful executions in 15min; state-change wiring proven]
  ↓
P-08  alert router + voice      [gate: SMS+email+30min voice escalation all delivered; dedupe works]
  ↓
P-09  dashboard                 [gate: 40+ tiles render; auto-refresh works; ACK writes DB]
  ↓
P-10  chaos tests + dual-write  [gate: 10/10 chaos pass; memory+SOP files in place; STATE.md updated]
```

Each gate is PASS/FAIL. Failing a gate blocks the next prompt. If a prompt needs rework, run its verification block until green before proceeding.

---

# Env vars required (set before P-07 activates)

| Env var | Where | Purpose |
|---|---|---|
| `SENTINELLE_SECRET` | Vercel prod + local `.env.local` + VPS `/root/.n8n/api-credentials.env` | Bearer auth on `/api/sentinelle/*` |
| `MIKAEL_ALERT_PHONE` | Vercel prod | Telnyx destination for SMS alerts |
| `N8N_API_KEY` | Vercel prod | already exists in VPS — mirror to Vercel |
| `TELNYX_API_KEY` | Vercel prod | already exists |
| `MAILGUN_API_KEY` | Vercel prod | already exists (rotated 2026-04-22) |
| `OPENAI_API_KEY` | Vercel prod | already exists |
| `RETELL_API_KEY` | Vercel prod | already exists |
| `STRIPE_SECRET_KEY` | Vercel prod | already exists |
| `VERCEL_TOKEN` | Vercel prod | for Vercel API checks — generate a read-only PAT |

---

# Out of scope (by design)

- PagerDuty / Opsgenie integrations (Sentinelle replaces them for this stack).
- Public status page (pause until tenant count justifies).
- Multi-region runner (one n8n instance is fine for current scale).
- Datadog / Grafana dashboards (dashboard in-app covers 95% of need).
- Log aggregation (Sentry tracked separately; not in this chain).

---

# CoVe Tier 1 self-check (run before dispatching any prompt)

For each prompt:
- [ ] Context explains WHY (not just WHAT).
- [ ] Task is atomic (no "also do X").
- [ ] 3+ NEVER constraints present.
- [ ] `<thinking_required>` present on complex prompts.
- [ ] `<output_format>` is specific XML shape.
- [ ] Verification is runnable (I can copy-paste the curl or SQL).
- [ ] Credentials line present.
- [ ] A context-free engineer could execute without asking clarifying questions.
- [ ] Under 500 words of core instructions (chain it if not).

END.
