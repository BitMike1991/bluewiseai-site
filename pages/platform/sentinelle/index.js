// Sentinelle — system health dashboard.
// Owner-gated. Auto-refresh every 30s. One API call per refresh.
// Click a tile → drawer with the 24h event log + paste-block diagnostic.

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import StatCard from '../../../src/components/dashboard/StatCard';
import StatusTile from '../../../src/components/sentinelle/StatusTile';
import Sparkline from '../../../src/components/sentinelle/Sparkline';
import { Activity, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, X } from 'lucide-react';

const CATEGORIES = ['all', 'n8n', 'api', 'db', 'external', 'infra', 'data_quality'];
const CRITICALITIES = ['all', 'critical', 'high', 'medium', 'low'];
const REFRESH_MS = 30_000;

function pasteBlockFor(check) {
  const ep = check.last_error_payload || {};
  const lines = [
    '```',
    `[Sentinelle ${(check.last_status || '?').toUpperCase()}] ${check.name || check.id}`,
    `check_id: ${check.id}`,
    `criticality: ${check.criticality}`,
    `status: ${check.last_status || 'ok'}`,
    `detail: ${(check.last_detail || '').slice(0, 300)}`,
    `ms: ${check.last_ms ?? '?'}`,
    `last_run_at: ${check.last_run_at || '?'}`,
  ];
  if (ep && typeof ep === 'object' && Object.keys(ep).length > 0) {
    lines.push('');
    lines.push('diagnostic:');
    for (const [k, v] of Object.entries(ep)) {
      if (v == null) continue;
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      lines.push(`  ${k}: ${val.length > 400 ? val.slice(0, 400) + '…' : val}`);
    }
  }
  lines.push('```');
  return lines.join('\n');
}

export default function SentinellePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [criticality, setCriticality] = useState('all');
  const [openCheck, setOpenCheck] = useState(null); // check_id whose drawer is open
  const [sparkByCheck, setSparkByCheck] = useState({}); // check_id → number[] (ms)

  async function load() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/sentinelle/dashboard', { credentials: 'include' });
      if (res.status === 401) { setError('not_authenticated'); return; }
      if (res.status === 403) { setError('owner_role_required'); return; }
      if (!res.ok) { setError(`http_${res.status}`); return; }
      const j = await res.json();
      setData(j);
      setError(null);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  // Lazy-load sparkline data when drawer opens, then keep it in memory
  useEffect(() => {
    if (!openCheck || sparkByCheck[openCheck]) return;
    (async () => {
      try {
        const r = await fetch(`/api/sentinelle/events?check_id=${encodeURIComponent(openCheck)}&hours=6`, { credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        const points = (j.events || []).filter(e => typeof e.ms === 'number').map(e => e.ms);
        setSparkByCheck((prev) => ({ ...prev, [openCheck]: points, [`${openCheck}__events`]: j.events }));
      } catch {}
    })();
  }, [openCheck]);

  const filteredChecks = useMemo(() => {
    if (!data?.checks) return [];
    return data.checks.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (criticality !== 'all' && c.criticality !== criticality) return false;
      return true;
    });
  }, [data, category, criticality]);

  async function handleAck(checkId) {
    try {
      const r = await fetch('/api/sentinelle/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ check_id: checkId }),
      });
      if (r.ok) await load();
    } catch {}
  }

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="p-6 text-d-muted">Loading Sentinelle…</div>
      </DashboardLayout>
    );
  }

  if (error === 'owner_role_required') {
    return (
      <DashboardLayout>
        <div className="p-6 text-rose-400">Sentinelle is owner-only. Your account does not have access.</div>
      </DashboardLayout>
    );
  }

  if (error === 'not_authenticated') {
    return (
      <DashboardLayout>
        <div className="p-6 text-d-muted">Please sign in to view Sentinelle.</div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary || { ok: 0, warn: 0, error: 0, critical: 0, total: 0 };
  const lastRun = data?.runs_today?.last;
  const lastRunAge = lastRun?.started_at ? Math.floor((Date.now() - new Date(lastRun.started_at).getTime()) / 1000) : null;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-d-text">Sentinelle</h1>
            <p className="text-sm text-d-muted">Live system health monitor — {data?.checks?.length ?? '—'} checks, refresh 30s</p>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="text-xs text-d-muted hover:text-d-text inline-flex items-center gap-1 px-2 py-1 rounded border border-d-border"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total" value={summary.total} icon={Activity} accent="" />
          <StatCard label="OK" value={summary.ok} icon={CheckCircle2} accent="border-l-emerald-500" />
          <StatCard label="Warn" value={summary.warn} icon={AlertTriangle} accent="border-l-amber-500" />
          <StatCard label="Critical" value={summary.critical} icon={XCircle} accent="border-l-rose-500" />
          <StatCard
            label="Last run"
            value={lastRunAge != null ? `${lastRunAge}s` : '—'}
            subLabel={lastRun ? `${lastRun.duration_ms}ms · ${data.runs_today.count} runs today` : null}
            icon={Clock}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-d-muted uppercase tracking-wide mr-1">Catégorie:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                category === c ? 'border-d-primary text-d-primary bg-d-primary/10' : 'border-d-border text-d-muted hover:text-d-text'
              }`}
            >{c}</button>
          ))}
          <span className="w-px h-4 bg-d-border mx-2" />
          <span className="text-xs text-d-muted uppercase tracking-wide mr-1">Criticité:</span>
          {CRITICALITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCriticality(c)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                criticality === c ? 'border-d-primary text-d-primary bg-d-primary/10' : 'border-d-border text-d-muted hover:text-d-text'
              }`}
            >{c}</button>
          ))}
        </div>

        {/* Tile grid */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredChecks.map((c) => (
            <StatusTile
              key={c.id}
              check={c}
              onAck={handleAck}
              onOpen={(id) => setOpenCheck(id)}
            />
          ))}
        </div>

        {filteredChecks.length === 0 && !loading && (
          <div className="text-center text-d-muted py-12">Aucun check pour ces filtres.</div>
        )}

        {/* Recent alerts */}
        {data?.recent_alerts?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-d-muted uppercase tracking-wide mb-3">Recent alerts (24h)</h2>
            <div className="rounded-xl border border-d-border bg-d-surface overflow-hidden">
              <table className="w-full text-xs">
                <thead className="text-d-muted bg-d-surface/50">
                  <tr><th className="text-left p-2">Time</th><th className="text-left p-2">Check</th><th className="text-left p-2">State</th><th className="text-left p-2">Detail</th><th className="text-left p-2">Channels</th></tr>
                </thead>
                <tbody>
                  {data.recent_alerts.slice(0, 10).map((a) => (
                    <tr key={a.id} className="border-t border-d-border/50">
                      <td className="p-2 text-d-muted whitespace-nowrap">{a.created_at?.slice(11, 19)}</td>
                      <td className="p-2 font-mono text-d-text">{a.check_id}</td>
                      <td className="p-2">{a.from_status} → <span className="text-rose-400">{a.to_status}</span></td>
                      <td className="p-2 text-d-muted truncate max-w-md">{a.detail}</td>
                      <td className="p-2 text-d-muted">{(a.channels || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {openCheck && (
        <DetailDrawer
          checkId={openCheck}
          onClose={() => setOpenCheck(null)}
          onAck={handleAck}
          check={data?.checks?.find((c) => c.id === openCheck)}
          events={sparkByCheck[`${openCheck}__events`] || []}
          sparkPoints={sparkByCheck[openCheck] || []}
        />
      )}
    </DashboardLayout>
  );
}

function DetailDrawer({ checkId, check, events, sparkPoints, onClose, onAck }) {
  const [copied, setCopied] = useState(false);
  if (!check) return null;
  const block = pasteBlockFor(check);

  async function copy() {
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full md:w-[640px] h-full bg-d-bg border-l border-d-border overflow-y-auto">
        <div className="sticky top-0 bg-d-bg border-b border-d-border p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-d-text truncate">{check.name || check.id}</div>
            <div className="text-xs text-d-muted font-mono truncate">{check.id}</div>
          </div>
          <button onClick={onClose} className="text-d-muted hover:text-d-text p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-xs text-d-muted">Latency 6h:</div>
            <div className="text-d-primary"><Sparkline points={sparkPoints} width={140} height={28} /></div>
            <div className="text-xs text-d-muted ml-auto">{events.length} events</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-d-muted uppercase tracking-wide">Paste-to-JARVIS block</h3>
              <button
                onClick={copy}
                className="text-[11px] px-2 py-0.5 rounded border border-d-border text-d-muted hover:text-d-text"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto border border-slate-700">
              {block}
            </pre>
          </div>

          {check.last_status !== 'ok' && (
            <button
              onClick={() => onAck(checkId)}
              className="w-full text-sm py-2 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            >
              Acknowledge this check
            </button>
          )}

          <div>
            <h3 className="text-xs font-semibold text-d-muted uppercase tracking-wide mb-2">Recent events (6h)</h3>
            <div className="rounded-xl border border-d-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="text-d-muted bg-d-surface/50">
                  <tr><th className="text-left p-2">Time</th><th className="text-left p-2">Status</th><th className="text-left p-2">ms</th><th className="text-left p-2">Detail</th></tr>
                </thead>
                <tbody>
                  {events.slice().reverse().slice(0, 50).map((e) => (
                    <tr key={e.id} className="border-t border-d-border/50">
                      <td className="p-2 text-d-muted whitespace-nowrap">{e.created_at?.slice(11, 19)}</td>
                      <td className={`p-2 ${e.status === 'ok' ? 'text-emerald-400' : e.status === 'warn' ? 'text-amber-400' : 'text-rose-400'}`}>{e.status}</td>
                      <td className="p-2 text-d-muted">{e.ms ?? '—'}</td>
                      <td className="p-2 text-d-muted truncate max-w-xs" title={e.detail}>{e.detail || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
