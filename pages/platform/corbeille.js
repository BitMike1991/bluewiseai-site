// pages/platform/corbeille.js
// Trash + Audit page — owner/admin only.
// - Recent (last 5 days): soft-deleted leads + jobs, restorable in 1 click
// - Audit log: every delete + restore action since the dawn of time
//   (Mikael 2026-04-21 — Jeremy must not be able to delete-then-hide
//   anything from the owner view)

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import EmptyState from "../../src/components/ui/EmptyState";
import { Trash2, Users, Briefcase, RotateCcw, Clock, ChevronDown, ChevronUp, Package } from "lucide-react";
import { fmtMoneyOrDash as fmt } from "../../lib/formatters";

function fmtDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" });
}

export default function CorbeillePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState({});
  const [showAudit, setShowAudit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/trash");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Échec du chargement");
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function restore(kind, id, label) {
    if (!window.confirm(`Restaurer « ${label} » ?`)) return;
    const key = `${kind}-${id}`;
    setRestoring((r) => ({ ...r, [key]: true }));
    try {
      const r = await fetch("/api/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Échec");
      await load();
    } catch (e) {
      window.alert(e.message);
    } finally {
      setRestoring((r) => ({ ...r, [key]: false }));
    }
  }

  const items = [
    ...((data?.leads) || []),
    ...((data?.jobs) || []),
    ...((data?.bons_de_commande) || []),
  ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-d-surface border border-d-border">
            <Trash2 size={20} className="text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-d-text">Corbeille</h1>
            <p className="text-xs text-d-muted">
              Items supprimés gardés {data?.retention_days || 5} jours, restaurables en un clic.
              Tout reste dans la base pour audit.
            </p>
          </div>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-d-muted text-sm">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Trash2}
              title="Corbeille vide"
              description="Aucun lead, projet ou bon de commande supprimé dans les derniers jours."
            />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-d-border rounded-xl border border-d-border overflow-hidden bg-d-surface/30">
            {items.map((it) => {
              const Icon = it.kind === "lead" ? Users : it.kind === "job" ? Briefcase : Package;
              const detailHref = it.kind === "lead"
                ? `/platform/leads/${it.id}`
                : it.kind === "job"
                  ? `/platform/jobs/${it.id}`
                  : `/hub/commande/${it.id}`;
              const kindLabel = it.kind === "lead" ? "Lead" : it.kind === "job" ? "Projet" : "BDC";
              const iconColor = it.kind === "lead"
                ? "bg-blue-500/10 text-blue-400"
                : it.kind === "job"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-emerald-500/10 text-emerald-400";
              const key = `${it.kind}-${it.id}`;
              const isRestoring = !!restoring[key];
              return (
                <li key={key} className="px-4 py-3 flex items-center gap-3 hover:bg-d-surface/50 transition">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${iconColor}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-d-bg border border-d-border text-d-muted">
                        {kindLabel}
                      </span>
                      <span className="text-sm font-medium text-d-text truncate">{it.label}</span>
                    </div>
                    {it.sub && (
                      <p className="text-xs text-d-muted truncate mt-0.5">{it.sub}</p>
                    )}
                    <p className="text-[10px] text-d-muted mt-1 flex items-center gap-1.5">
                      <Clock size={10} />
                      Supprimé {fmtDate(it.deleted_at)} · Reste {it.days_remaining} jour{it.days_remaining > 1 ? "s" : ""} dans la corbeille
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => restore(it.kind, it.id, it.label)}
                      disabled={isRestoring}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RotateCcw size={12} />
                      {isRestoring ? "Restauration…" : "Restaurer"}
                    </button>
                    <Link
                      href={detailHref}
                      className="px-3 py-1.5 rounded-lg border border-d-border text-xs text-d-muted hover:text-d-text"
                    >
                      Voir
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Audit history — collapsed by default */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowAudit((s) => !s)}
            className="flex items-center gap-2 text-xs text-d-muted hover:text-d-text"
          >
            {showAudit ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Historique complet ({data?.audit?.length || 0} action{(data?.audit?.length || 0) > 1 ? "s" : ""})
          </button>
          {showAudit && (
            <div className="mt-3 rounded-xl border border-d-border bg-d-surface/30 overflow-hidden">
              <ul className="divide-y divide-d-border max-h-96 overflow-y-auto">
                {(data?.audit || []).length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-d-muted">Aucune action enregistrée.</li>
                ) : (
                  (data.audit || []).map((a) => (
                    <li key={a.id} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ${a.action === "deleted" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                        {a.action === "deleted" ? "Suppr." : "Restaur."}
                      </span>
                      <span className="text-d-muted font-mono">{a.entity_type}#{a.entity_id}</span>
                      <span className="flex-1 truncate text-d-text">{a.entity_label || "—"}</span>
                      <span className="text-d-muted truncate max-w-[180px]">{a.user_email || "—"}</span>
                      <span className="text-d-muted whitespace-nowrap">{fmtDate(a.created_at)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
