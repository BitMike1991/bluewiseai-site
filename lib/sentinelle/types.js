/**
 * Sentinelle — shared types + constants (P-00).
 * Mirrors supabase/migrations/20260422_p0_sentinelle_schema.sql.
 * All other Sentinelle modules (P-01 through P-10) import from here.
 */

export const CATEGORIES = ['n8n', 'api', 'db', 'external', 'infra', 'data_quality'];
export const CRITICALITIES = ['low', 'medium', 'high', 'critical'];
export const STATUSES = ['ok', 'warn', 'critical', 'error'];
export const ALERT_CHANNELS = ['sms', 'email', 'voice'];

export const INTERVALS = {
  FAST: 300,     // 5 min — default
  MEDIUM: 900,   // 15 min
  SLOW: 3600,    // 1 h
};

/**
 * @typedef {Object} HealthCheck
 * @property {string} id                    Stable identifier, e.g. 'n8n.active_count'
 * @property {string} name                  Human label
 * @property {'n8n'|'api'|'db'|'external'|'infra'|'data_quality'} category
 * @property {'low'|'medium'|'high'|'critical'} criticality
 * @property {number} interval_sec
 * @property {boolean} enabled
 * @property {Object} baseline              Thresholds/config specific to this check
 * @property {string|null} last_run_at
 * @property {'ok'|'warn'|'critical'|'error'|null} last_status
 * @property {string|null} last_detail
 * @property {number|null} last_ms
 * @property {number} consecutive_failures
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} HealthEvent
 * @property {number} id
 * @property {string} check_id
 * @property {'ok'|'warn'|'critical'|'error'} status
 * @property {string|null} detail
 * @property {number|null} ms
 * @property {boolean} state_changed
 * @property {boolean} alerted
 * @property {string[]} alert_channels
 * @property {boolean} acknowledged
 * @property {string|null} acknowledged_by
 * @property {string|null} acknowledged_at
 * @property {string} created_at
 */

/**
 * @typedef {Object} CheckResult
 * @property {string} id
 * @property {'ok'|'warn'|'critical'|'error'} status
 * @property {string} detail
 * @property {number} ms
 */

export const SENTINELLE_VERSION = 'p0.1.0';
