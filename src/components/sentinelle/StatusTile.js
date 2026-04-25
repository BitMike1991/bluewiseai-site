// Sentinelle status tile.
// Props:
//   check: row from system_health_checks (incl. last_*, last_error_payload, acknowledged_at)
//   onAck:  fn(check_id) — called when "Acknowledge" clicked
//   onOpen: fn(check_id) — opens the detail drawer
//   sparkPoints: optional number[] of recent latencies

import Sparkline from './Sparkline';

const STATUS_STYLES = {
  ok:       { dot: 'bg-emerald-400', ring: 'ring-emerald-500/20', accent: 'border-emerald-500/40', label: 'OK' },
  warn:     { dot: 'bg-amber-400',   ring: 'ring-amber-500/30',   accent: 'border-amber-500/50',   label: 'WARN' },
  error:    { dot: 'bg-rose-400',    ring: 'ring-rose-500/30',    accent: 'border-rose-500/50',    label: 'ERROR' },
  critical: { dot: 'bg-rose-500',    ring: 'ring-rose-500/40',    accent: 'border-rose-500/70',    label: 'CRIT' },
};

const CRITICALITY_CHIP = {
  critical: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  high:     'bg-amber-500/10 text-amber-300 border-amber-500/30',
  medium:   'bg-sky-500/10 text-sky-300 border-sky-500/30',
  low:      'bg-d-muted/10 text-d-muted border-d-muted/30',
};

function formatAge(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86_400)}d ago`;
}

export default function StatusTile({ check, onAck, onOpen, sparkPoints = [] }) {
  const status = check.last_status || 'ok';
  const style = STATUS_STYLES[status] || STATUS_STYLES.ok;
  const critChip = CRITICALITY_CHIP[check.criticality] || CRITICALITY_CHIP.medium;
  const isAcked = !!check.acknowledged_at;
  const showAck = (status === 'critical' || status === 'error' || status === 'warn') && !isAcked;

  return (
    <div
      className={`rounded-2xl border ${style.accent} bg-d-surface p-4 shadow-lg ring-1 ${style.ring} transition-colors duration-200 hover:border-d-primary/40 flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot} shrink-0`} aria-hidden="true" />
          <button
            onClick={() => onOpen?.(check.id)}
            className="text-left text-sm font-medium text-d-text truncate hover:underline"
            title={check.id}
          >
            {check.name || check.id}
          </button>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${critChip} shrink-0`}>
          {style.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-d-muted gap-2">
        <span className="font-mono truncate" title={check.id}>{check.id}</span>
        <span className={`px-1.5 py-0.5 rounded border ${critChip} text-[10px] font-medium uppercase shrink-0`}>
          {check.criticality}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-d-muted font-mono break-words leading-snug">
            {(check.last_detail || '—').slice(0, 80)}
          </div>
          <div className="text-[10px] text-d-muted mt-1">
            {formatAge(check.last_run_at)} · {check.last_ms != null ? `${check.last_ms}ms` : '—'}
            {check.consecutive_failures > 0 && (
              <span className="ml-2 text-rose-400">{check.consecutive_failures}× consecutive</span>
            )}
          </div>
        </div>
        <div className="text-d-primary shrink-0">
          <Sparkline points={sparkPoints} width={72} height={22} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-d-border/50">
        <button
          onClick={() => onOpen?.(check.id)}
          className="text-[11px] text-d-muted hover:text-d-text transition-colors"
        >
          Détails →
        </button>
        <span className="flex-1" />
        {isAcked ? (
          <span className="text-[11px] text-emerald-400">✓ ack {formatAge(check.acknowledged_at)}</span>
        ) : showAck ? (
          <button
            onClick={() => onAck?.(check.id)}
            className="text-[11px] px-2 py-1 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            Acknowledge
          </button>
        ) : null}
      </div>
    </div>
  );
}
