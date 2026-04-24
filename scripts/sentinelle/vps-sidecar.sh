#!/bin/bash
# Sentinelle VPS sidecar — runs every 60s via cron.
# Collects pm2 process list, disk/RAM, n8n sqlite mtime, latest backup mtime.
# POSTs to /api/sentinelle/ingest-vps on the Next.js server with SENTINELLE_SECRET bearer.
#
# Install:
#   1. Save this file on the VPS (e.g. /root/scripts/sentinelle/vps-sidecar.sh)
#   2. chmod +x
#   3. Source /root/.n8n/api-credentials.env to expose SENTINELLE_SECRET + INGEST_URL
#   4. Add to crontab: `* * * * * /root/scripts/sentinelle/vps-sidecar.sh >> /var/log/sentinelle-sidecar.log 2>&1`

set -u

# ─── Load secrets ────────────────────────────────────────────────
if [ -f "/root/.n8n/api-credentials.env" ]; then
  # shellcheck disable=SC1091
  source /root/.n8n/api-credentials.env
fi
SENTINELLE_SECRET="${SENTINELLE_SECRET:-}"
INGEST_URL="${SENTINELLE_INGEST_URL:-https://www.bluewiseai.com/api/sentinelle/ingest-vps}"

if [ -z "$SENTINELLE_SECRET" ]; then
  echo "$(date -Iseconds) FATAL SENTINELLE_SECRET not set" >&2
  exit 1
fi

HOST="$(hostname)"
NOW="$(date -Iseconds)"

# ─── pm2 list ────────────────────────────────────────────────────
# pm2 jlist returns JSON array. Parse to compact structure.
PM2_JSON="$(pm2 jlist 2>/dev/null || echo '[]')"
PM2_COMPACT="$(echo "$PM2_JSON" | python3 -c "
import json, sys, time
try:
    procs = json.load(sys.stdin)
except Exception:
    procs = []
out = []
for p in procs:
    pm2e = p.get('pm2_env', {})
    started_ms = pm2e.get('pm_uptime', 0)
    uptime_h = round((time.time()*1000 - started_ms)/3_600_000, 1) if started_ms else None
    out.append({
        'name': p.get('name'),
        'status': pm2e.get('status'),
        'restarts': pm2e.get('restart_time'),
        'uptime_h': uptime_h,
        'cpu': p.get('monit', {}).get('cpu'),
        'memory_mb': round(p.get('monit', {}).get('memory', 0) / 1048576, 1),
    })
print(json.dumps(out))
")"

# ─── Disk (root) ─────────────────────────────────────────────────
DISK_USE_PCT="$(df / | awk 'NR==2 { gsub("%",""); print $5 }')"
DISK_FREE_MB="$(df -m / | awk 'NR==2 { print $4 }')"

# ─── RAM ─────────────────────────────────────────────────────────
RAM_FREE_MB="$(free -m | awk 'NR==2 { print $7 }')"
RAM_TOTAL_MB="$(free -m | awk 'NR==2 { print $2 }')"

# ─── n8n sqlite size + age ───────────────────────────────────────
N8N_SQLITE="/root/.n8n/database.sqlite"
if [ -f "$N8N_SQLITE" ]; then
  SQLITE_SIZE_MB="$(du -m "$N8N_SQLITE" | cut -f1)"
  SQLITE_MTIME="$(stat -c %Y "$N8N_SQLITE")"
  SQLITE_AGE_MIN="$(( ($(date +%s) - SQLITE_MTIME) / 60 ))"
else
  SQLITE_SIZE_MB="null"
  SQLITE_AGE_MIN="null"
fi

# ─── Latest n8n backup ───────────────────────────────────────────
LATEST_BACKUP="$(ls -t /root/n8n-backups/*.gz 2>/dev/null | head -1 || true)"
if [ -n "${LATEST_BACKUP:-}" ]; then
  BACKUP_MTIME="$(stat -c %Y "$LATEST_BACKUP")"
  BACKUP_AGE_H="$(( ($(date +%s) - BACKUP_MTIME) / 3600 ))"
else
  BACKUP_AGE_H="null"
fi

# ─── Assemble payload ────────────────────────────────────────────
PAYLOAD="$(python3 -c "
import json, sys
payload = {
  'pm2': json.loads('''$PM2_COMPACT'''),
  'disk_use_pct': int('$DISK_USE_PCT'),
  'disk_free_mb': int('$DISK_FREE_MB'),
  'ram_free_mb': int('$RAM_FREE_MB'),
  'ram_total_mb': int('$RAM_TOTAL_MB'),
  'sqlite_size_mb': None if '$SQLITE_SIZE_MB' == 'null' else int('$SQLITE_SIZE_MB'),
  'sqlite_age_min': None if '$SQLITE_AGE_MIN' == 'null' else int('$SQLITE_AGE_MIN'),
  'backup_age_hours': None if '$BACKUP_AGE_H' == 'null' else int('$BACKUP_AGE_H'),
}
body = { 'host': '$HOST', 'collected_at': '$NOW', 'payload': payload }
print(json.dumps(body))
")"

# ─── POST ────────────────────────────────────────────────────────
HTTP_CODE="$(curl -s -o /tmp/sentinelle-sidecar-resp.json -w '%{http_code}' \
  --max-time 10 \
  -X POST "$INGEST_URL" \
  -H "Authorization: Bearer $SENTINELLE_SECRET" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

if [ "$HTTP_CODE" = "200" ]; then
  # Silent on success (cron would email every minute otherwise)
  exit 0
else
  echo "$(date -Iseconds) sidecar POST failed HTTP $HTTP_CODE" >&2
  cat /tmp/sentinelle-sidecar-resp.json >&2 2>/dev/null || true
  exit 2
fi
