# Sentinelle n8n workflows — source-of-truth templates

The n8n SQLite is authoritative at runtime, but these JSON snapshots let us
recreate the workflows from scratch if the SQLite is lost or migrated.

## Workflows

| File | Live ID | Trigger | Purpose |
|------|---------|---------|---------|
| `voice-escalation-poller.json` | `esGAok6u0Tz9RwbV` | cron `* * * * *` | drains `system_health_escalations` (status=pending, due, still-critical) → Retell call to `MIKAEL_ALERT_PHONE` |

(The other Sentinelle workflows — Sentinelle Runner `t0f9ofw5CmY6nxdJ` and
Sentinelle Alert Router `1HKZu4TJkqF6TvAj` — were created earlier; this dir
will hold their templates too once exported.)

## Retell resources used by Voice Escalation Poller

| Resource | ID |
|---------|-----|
| Agent | `agent_0a57b37818e2a4f00a725a0759` (Sentinelle Escalation, `cartesia-Pierre`, fr-CA) |
| LLM | `llm_67f5d631e25ac12f63ff249ed0c9` (claude-4.6-sonnet) |
| From-number | `+15144184743` (BW, already imported into Retell) |

## n8n credentials referenced

| Credential | ID | Used by |
|-----------|-----|---------|
| Supabase Database | `cHvqnVOGqHt37625` | all Postgres nodes |
| Retell Bearer | `OOrI1pRmJzQ1b4aZ` | `Retell create-phone-call` |
| Mailgun Basic Auth | `n63WeOtM8EZM6IrK` | Sentinelle Alert Router → Mailgun |
| Telnyx Bearer | `1yZAqXlWshCdvKlK` | Sentinelle Alert Router → Telnyx SMS |
| Sentinelle Webhook Header | `pcqwBSEQ3UJWS4r2` | gates `/sentinelle-alert` webhook |
| Sentinelle Bearer | `iCS6N0VmwNw8yrgO` | Sentinelle Runner → /api/sentinelle/run-all |

## n8n env vars (set in `/root/ecosystem.config.js`)

- `MIKAEL_ALERT_PHONE` — destination for SMS + voice escalation. Read in n8n
  Code nodes via `$env.MIKAEL_ALERT_PHONE` (NOT `process.env`, the VM2 sandbox
  strips `process`).

## Recreate a workflow from JSON

```bash
source /root/.n8n/api-credentials.env
curl -s -X POST "https://automation.bluewiseai.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @scripts/sentinelle/n8n/voice-escalation-poller.json
# capture the returned id, then:
curl -s -X POST "https://automation.bluewiseai.com/api/v1/workflows/<ID>/activate" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

After any restart of n8n, run `/root/n8n-webhook-reregister.sh` to make sure
all webhook URLs are live (Sentinelle Alert Router included).
