// pages/platform/ask.js
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";

// -----------------------------
// Small UI utilities
// -----------------------------
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatWhen(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffH < 24) return `${diffH} h ago`;
  return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
}

function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function truncateText(str, max = 420) {
  const s = (str || "").toString().replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "\u2026";
}

function badgeTone(kind) {
  const k = (kind || "").toLowerCase();
  if (k === "high") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (k === "medium") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (k === "low") return "border-slate-700 bg-slate-900/40 text-slate-200";
  if (k === "positive") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (k === "negative") return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  if (k === "mixed") return "border-violet-500/40 bg-violet-500/10 text-violet-200";
  if (k === "neutral") return "border-slate-700 bg-slate-900/40 text-slate-200";
  return "border-slate-700 bg-slate-900/40 text-slate-200";
}

// Color avatar (deterministic by name)
const AVATAR_COLORS = [
  "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

function avatarColor(name) {
  let hash = 0;
  const s = (name || "?").toString();
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function avatarInitials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

// -----------------------------
// Storage helpers (history + saved prompts)
// -----------------------------
const LS_HISTORY = "bluewise.ask.history.v1";
const LS_SAVED = "bluewise.ask.saved.v1";

function loadJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// -----------------------------
// Sub-components
// -----------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6">
        <div className="h-5 w-48 rounded-lg bg-slate-700/60" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded-lg bg-slate-700/40" />
          <div className="h-4 w-5/6 rounded-lg bg-slate-700/40" />
          <div className="h-4 w-3/4 rounded-lg bg-slate-700/40" />
        </div>
        <div className="mt-6 flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-slate-700/40" />
          <div className="h-10 w-28 rounded-xl bg-slate-700/40" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        badgeTone(tone || label)
      )}
    >
      {label}
    </span>
  );
}

function MetricPill({ label, value, color }) {
  const colorMap = {
    rose: "bg-rose-500/15 border-rose-500/30 text-rose-200",
    amber: "bg-amber-500/15 border-amber-500/30 text-amber-200",
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200",
    violet: "bg-violet-500/15 border-violet-500/30 text-violet-200",
    sky: "bg-sky-500/15 border-sky-500/30 text-sky-200",
    slate: "bg-slate-800/60 border-slate-700 text-slate-200",
  };
  return (
    <div className={cx("rounded-xl border px-4 py-2.5 text-center", colorMap[color] || colorMap.slate)}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs uppercase tracking-wide font-semibold text-slate-400">{children}</p>;
}

function DetailSection({ title, items }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <svg
          className={cx("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-slate-800">
          <ul className="mt-2 space-y-1.5">
            {items.slice(0, 8).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-slate-500 shrink-0">&#8226;</span>
                <span>{safeText(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ open, onClose, history, onReuse, onView, onClear }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950 border-l border-slate-800 z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <p className="text-base font-semibold text-slate-100">History</p>
            <p className="text-xs text-slate-400 mt-0.5">Last 40 queries, stored locally</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-500/40 hover:text-rose-200 hover:bg-rose-500/10"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center mt-8">No history yet.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="text-sm font-semibold text-slate-100 leading-snug">{h.q}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatTimeAgo(h.at)}
                  {h.resultType ? ` \u00b7 ${h.resultType}` : ""}
                </p>
                {h.snapshot ? <p className="mt-2 text-sm text-slate-400 line-clamp-2">{h.snapshot}</p> : null}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onReuse(h.q)}
                    className="rounded-lg border border-slate-700 bg-slate-900/40 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200"
                  >
                    Reuse
                  </button>
                  <button
                    onClick={() => onView(h.raw)}
                    className="rounded-lg border border-sky-500/60 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function SavedDropdown({ saved, onApply, onRemove, onSave, question }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cx(
          "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
          open
            ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
            : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-sky-500/40 hover:text-sky-200"
        )}
        title="Saved prompts"
      >
        <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Saved
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-800 bg-slate-950 shadow-xl z-30">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Saved prompts</span>
            {question?.trim() && (
              <button
                onClick={() => { onSave(); setOpen(false); }}
                className="text-xs font-semibold text-sky-300 hover:text-sky-200"
              >
                + Save current
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {saved.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">No saved prompts yet.</p>
            ) : (
              saved.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-800/60 group"
                >
                  <button
                    onClick={() => { onApply(s.q); setOpen(false); }}
                    className="min-w-0 text-left flex-1"
                  >
                    <p className="text-sm font-medium text-slate-200 truncate">{s.label}</p>
                  </button>
                  <button
                    onClick={() => onRemove(s.id)}
                    className="shrink-0 text-xs text-slate-500 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------
// Result renderers
// -----------------------------

function ResultEcho() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-100">Couldn&apos;t match a tool</p>
      <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
        Try a more specific query like &quot;Show open tasks&quot;, &quot;Summarize Marc&apos;s conversation&quot;, or &quot;Leads no reply 24h&quot;.
      </p>
    </div>
  );
}

function ResultLeadList({ result, leadRows, onSummarize, onDraft }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-100">{result.title || "Lead list"}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {leadRows.length} match{leadRows.length === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      {leadRows.length === 0 ? (
        <p className="text-sm text-slate-500">No matching leads.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leadRows.map((r) => (
            <div key={r.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex gap-3">
              <div className={cx("w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white", avatarColor(r.name))}>
                {avatarInitials(r.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100 truncate">{r.name}</p>
                  <StatusPill label={r.status} tone="low" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {r.phone || ""}{r.phone && r.email ? " \u00b7 " : ""}{r.email || ""}
                </p>
                {r.lastContactAt && (
                  <p className="text-xs text-slate-500 mt-1">Last contact: {formatTimeAgo(r.lastContactAt)}</p>
                )}
                {r.missedCallCount > 0 && (
                  <p className="text-xs text-rose-300 mt-0.5">{r.missedCallCount} missed call{r.missedCallCount > 1 ? "s" : ""}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.leadId && (
                    <Link
                      href={`/platform/leads/${r.leadId}`}
                      className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                    >
                      Open
                    </Link>
                  )}
                  {r.leadId && (
                    <button
                      onClick={() => onSummarize(r.leadId)}
                      className="rounded-lg border border-sky-500/50 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
                    >
                      Summarize
                    </button>
                  )}
                  {r.leadId && (
                    <button
                      onClick={() => onDraft(r.leadId)}
                      className="rounded-lg border border-sky-500/50 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
                    >
                      Draft
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultSummary({ result, convoItem, onCreateTask, onDraft }) {
  const sentimentColor = {
    positive: "emerald", negative: "rose", mixed: "violet", neutral: "slate",
  };
  const urgencyColor = {
    high: "rose", medium: "amber", low: "slate",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-lg font-semibold text-slate-100">{result.title || "Conversation summary"}</p>

      {/* Metric pills */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {convoItem?.sentiment && (
          <MetricPill label="Sentiment" value={convoItem.sentiment} color={sentimentColor[convoItem.sentiment] || "slate"} />
        )}
        {convoItem?.urgency && (
          <MetricPill label="Urgency" value={convoItem.urgency} color={urgencyColor[convoItem.urgency] || "slate"} />
        )}
        {convoItem?.messageCount != null && (
          <MetricPill label="Messages" value={convoItem.messageCount} color="sky" />
        )}
        {convoItem?.daysBack != null && (
          <MetricPill label="Days back" value={`${convoItem.daysBack}d`} color="slate" />
        )}
      </div>

      {/* Summary text */}
      {convoItem?.summary && (
        <p className="mt-5 text-base text-slate-200 leading-relaxed">{safeText(convoItem.summary)}</p>
      )}

      {convoItem?.leadIntent && (
        <p className="mt-3 text-sm text-slate-400">
          <span className="font-semibold text-slate-300">Lead intent:</span> {safeText(convoItem.leadIntent)}
        </p>
      )}

      {/* Action buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        {convoItem?.leadId && (
          <Link
            href={`/platform/leads/${convoItem.leadId}`}
            className="rounded-xl border border-sky-500/60 px-4 py-2 text-sm font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
          >
            Open lead
          </Link>
        )}
        {convoItem?.leadId && (
          <button
            onClick={() => onCreateTask(convoItem.leadId, convoItem.recommendedFollowUpType || "call")}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
          >
            Create follow-up
          </button>
        )}
        {convoItem?.leadId && (
          <button
            onClick={() => onDraft(convoItem.leadId)}
            className="rounded-xl border border-sky-500/60 px-4 py-2 text-sm font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
          >
            Draft reply
          </button>
        )}
      </div>

      {/* Collapsible details */}
      <div className="mt-5 space-y-2">
        <DetailSection title="Key details" items={convoItem?.keyDetails} />
        <DetailSection title="Objections" items={convoItem?.objections} />
        <DetailSection title="Next steps" items={convoItem?.nextSteps} />
        <DetailSection title="Open questions" items={convoItem?.openQuestions} />
      </div>
    </div>
  );
}

function ResultDraft({
  result, draftItem, computedDraftChannel, computedSendTo,
  draftSubject, setDraftSubject, draftBody, setDraftBody,
  draftChannelOverride, setDraftChannelOverride,
  draftVariantId, applyVariant,
  sending, sendDraftNow, sendError, sendResult,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const variants = Array.isArray(draftItem?.variants) ? draftItem.variants : [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-100">{result.title || "Draft reply"}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            Lead #{draftItem?.leadId}
            {draftItem?.leadName ? ` \u00b7 ${draftItem.leadName}` : ""}
          </p>
        </div>
        {draftItem?.leadId && (
          <Link
            href={`/platform/leads/${draftItem.leadId}`}
            className="shrink-0 rounded-xl border border-sky-500/60 px-3 py-2 text-sm font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
          >
            Open lead
          </Link>
        )}
      </div>

      {/* To + Channel */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">
          To: <span className="font-semibold text-slate-100">{computedSendTo || "\u2014"}</span>
        </p>
        <span className={cx(
          "rounded-full border px-2.5 py-1 text-xs font-semibold",
          computedDraftChannel === "sms"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-sky-500/40 bg-sky-500/10 text-sky-200"
        )}>
          {computedDraftChannel === "sms" ? "SMS" : "Email"}
        </span>
      </div>

      {/* Subject (email only) */}
      {computedDraftChannel === "email" && (
        <div className="mt-3">
          <SectionLabel>Subject</SectionLabel>
          <input
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
            placeholder="Email subject"
          />
        </div>
      )}

      {/* Body */}
      <div className="mt-3">
        <SectionLabel>Message</SectionLabel>
        <textarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          rows={computedDraftChannel === "sms" ? 4 : 6}
          className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
          placeholder={computedDraftChannel === "sms" ? "SMS message..." : "Email body..."}
        />
        {computedDraftChannel === "sms" && (
          <p className="mt-1 text-xs text-slate-500">{draftBody?.length || 0} characters</p>
        )}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 text-xs font-semibold text-slate-400 hover:text-slate-300"
      >
        {showAdvanced ? "Hide advanced" : "Advanced options"}
      </button>

      {showAdvanced && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Channel</label>
            <select
              value={draftChannelOverride}
              onChange={(e) => setDraftChannelOverride(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="auto">Auto</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          {variants.length > 1 && (
            <div>
              <label className="text-xs text-slate-500 block mb-1">Variant</label>
              <select
                value={draftVariantId}
                onChange={(e) => applyVariant(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-200"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>Variant {v.id}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1" />
          {draftItem?.matchReason && <StatusPill label={`matched: ${draftItem.matchReason}`} tone="low" />}
          {draftItem?.tone && <StatusPill label={`tone: ${draftItem.tone}`} tone="low" />}
          {draftItem?.language && <StatusPill label={`lang: ${draftItem.language}`} tone="low" />}
        </div>
      )}

      {/* Send button */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {draftItem?.scheduledForLocal ? `Follow-up time: ${draftItem.scheduledForLocal}` : ""}
        </div>
        <button
          onClick={sendDraftNow}
          disabled={sending}
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {sending ? "Sending\u2026" : `Send ${computedDraftChannel === "sms" ? "SMS" : "Email"}`}
        </button>
      </div>

      {/* Send feedback */}
      {sendError && <p className="mt-3 text-sm text-rose-300">{sendError}</p>}

      {sendResult?.success && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">Sent successfully</p>
          <p className="mt-1 text-xs text-slate-300">
            Provider: {sendResult.provider || "\u2014"} \u00b7 ID: {sendResult.message_id || "\u2014"}
          </p>
        </div>
      )}

      {sendResult && sendResult.success === false && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-200">Send failed</p>
          <p className="mt-1 text-xs text-slate-300">{safeText(sendResult.error || "Unknown error")}</p>
        </div>
      )}
    </div>
  );
}

function ResultTaskList({ result, tasks }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-100">{result.title || "Follow-up tasks"}</p>
        <p className="text-sm text-slate-400 mt-0.5">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </p>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No matching tasks.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-start gap-4">
              <div className={cx(
                "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold",
                t.status === "completed"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
              )}>
                {t.status === "completed" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {t.followupType.charAt(0).toUpperCase() + t.followupType.slice(1)} follow-up
                  </p>
                  <StatusPill label={t.status} tone={t.status === "completed" ? "positive" : "low"} />
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {t.scheduledFor ? formatWhen(t.scheduledFor) : "No date"}
                  {t.createdAt ? ` \u00b7 Created ${formatTimeAgo(t.createdAt)}` : ""}
                </p>
                {t.note && <p className="mt-2 text-sm text-slate-300">{safeText(t.note)}</p>}
              </div>
              {t.leadId && (
                <Link
                  href={`/platform/leads/${t.leadId}`}
                  className="shrink-0 rounded-lg border border-sky-500/50 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:border-sky-400 hover:bg-sky-500/10"
                >
                  Lead #{t.leadId}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultTaskConfirm({ result, isCreated }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-slate-100">
          {result.title || (isCreated ? "Follow-up created" : "Follow-up updated")}
        </p>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">
        {result.items?.[0]?.leadId ? (
          <>
            Lead{" "}
            <Link
              href={`/platform/leads/${result.items[0].leadId}`}
              className="text-sky-200 hover:text-sky-100 hover:underline underline-offset-4"
            >
              #{result.items[0].leadId}
            </Link>
            {" "}\u00b7 {truncateText(result.aiSummary || "", 380)}
          </>
        ) : (
          truncateText(result.aiSummary || "", 520)
        )}
      </p>
    </div>
  );
}

function ResultOther({ result }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-lg font-semibold text-slate-100">{result.title || "Result"}</p>
      <p className="mt-3 text-sm text-slate-200 whitespace-pre-line leading-relaxed">
        {truncateText(result.aiSummary || "", 900)}
      </p>
    </div>
  );
}

// -----------------------------
// Main page
// -----------------------------
export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  const [result, setResult] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState([]);

  const inputRef = useRef(null);

  // Draft UI state
  const [draftVariantId, setDraftVariantId] = useState("v1");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftChannelOverride, setDraftChannelOverride] = useState("auto");

  useEffect(() => {
    setHistory(loadJson(LS_HISTORY, []));
    setSaved(
      loadJson(LS_SAVED, [
        { id: "s1", label: "Summarize a lead", q: "Summarize Marc's conversation" },
        { id: "s2", label: "No reply 24h", q: "Which leads haven't replied in 24h?" },
        { id: "s3", label: "Missed calls no follow-up", q: "Show missed calls without follow-up." },
        { id: "s4", label: "Tasks due today", q: "Show tasks due today." },
        { id: "s5", label: "Draft reply", q: "Draft an email reply to confirm the follow-up for lead #1" },
      ])
    );
  }, []);

  useEffect(() => {
    saveJson(LS_HISTORY, history);
  }, [history]);

  useEffect(() => {
    saveJson(LS_SAVED, saved);
  }, [saved]);

  const resultType = result?.resultType || null;
  const intent = result?.intent || null;

  const isEcho = result && intent === "echo";
  const isLeadList = result && resultType === "lead_list" && intent !== "echo";
  const isConversationSummary = result && resultType === "conversation_summary" && intent !== "echo";
  const isTaskList = result && resultType === "task_list" && intent !== "echo";
  const isTaskCreated = result && resultType === "task_created" && intent !== "echo";
  const isTaskUpdated = result && resultType === "task_updated" && intent !== "echo";
  const isDraftReply = result && resultType === "draft_reply" && intent !== "echo";

  const isActionOther =
    result &&
    intent !== "echo" &&
    resultType &&
    !isLeadList &&
    !isConversationSummary &&
    !isTaskList &&
    !isTaskCreated &&
    !isTaskUpdated &&
    !isDraftReply;

  const convoItem = isConversationSummary ? result.items?.[0] : null;
  const draftItem = isDraftReply ? result.items?.[0] : null;

  // Reset Send UI status whenever we get a new result
  useEffect(() => {
    setSendResult(null);
    setSendError(null);
  }, [result?.intent, result?.resultType]);

  // When a draft arrives, prime editable fields from the selected variant
  useEffect(() => {
    if (!isDraftReply || !draftItem) return;

    const variants = Array.isArray(draftItem.variants) ? draftItem.variants : [];
    const v1 = variants.find((x) => x?.id === "v1") || variants[0] || null;

    setDraftVariantId(v1?.id || "v1");
    setDraftSubject((v1?.subject || draftItem.subject || "").toString());
    setDraftBody((v1?.body || draftItem.body || "").toString());
    setDraftChannelOverride("auto");
  }, [isDraftReply, draftItem?.leadId]);

  // --- smart "ask" -----------------------------------
  async function runAsk(q) {
    const cleaned = (q || "").trim();
    if (!cleaned) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleaned }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || `Ask failed with ${res.status}`);

      setResult(json);

      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toISOString(),
        q: cleaned,
        intent: json.intent || null,
        resultType: json.resultType || null,
        title: json.title || null,
        aiSummary: json.aiSummary || null,
        snapshot:
          json.resultType === "conversation_summary"
            ? truncateText(json.items?.[0]?.summary || json.aiSummary || "", 220)
            : truncateText(json.aiSummary || "", 220),
        raw: json,
      };

      setHistory((prev) => [entry, ...prev].slice(0, 40));
    } catch (err) {
      console.error("[/platform/ask] error:", err);
      setError(err.message || "Failed to answer question.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runAsk(question);
  }

  function applyPrompt(q) {
    setQuestion(q);
    setTimeout(() => inputRef.current?.focus?.(), 50);
  }

  function saveCurrentPrompt() {
    const q = (question || "").trim();
    if (!q) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const label = q.length > 40 ? q.slice(0, 40) + "\u2026" : q;
    setSaved((prev) => [{ id, label, q }, ...prev].slice(0, 12));
  }

  function removeSaved(id) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  function clearHistory() {
    setHistory([]);
    saveJson(LS_HISTORY, []);
  }

  // --- "power actions" built on your existing /api/ask tools -----------
  function quickSummarizeLead(leadId) {
    runAsk(`Summarize the conversation for lead #${leadId}`);
  }

  function quickCreateTask(leadId, followupType) {
    runAsk(
      `Create a ${followupType} follow-up for lead #${leadId} tomorrow at 9:00. Note: Auto-created from Command Center.`
    );
  }

  function quickDraftReply(leadId) {
    applyPrompt(`Draft a reply for lead #${leadId} to confirm next steps`);
  }

  // --- Draft actions ---------------------------------
  function applyVariant(variantId) {
    if (!draftItem) return;
    const variants = Array.isArray(draftItem.variants) ? draftItem.variants : [];
    const v = variants.find((x) => x?.id === variantId) || variants[0] || null;

    setDraftVariantId(variantId);
    setDraftSubject((v?.subject || draftItem.subject || "").toString());
    setDraftBody((v?.body || draftItem.body || "").toString());
  }

  const computedDraftChannel = useMemo(() => {
    if (!draftItem) return null;
    const ch = (draftItem.channel || "").toLowerCase();
    if (draftChannelOverride === "email" || draftChannelOverride === "sms") return draftChannelOverride;
    if (ch === "email" || ch === "sms") return ch;
    return "email";
  }, [draftItem, draftChannelOverride]);

  const computedSendTo = useMemo(() => {
    if (!draftItem) return null;
    const direct = draftItem.suggestedSendTo || draftItem.suggestedSuggestedSendTo || null;
    if (direct) return direct;

    const meta = draftItem.meta?.to || {};
    if (computedDraftChannel === "sms") return meta.phone || null;
    return meta.email || null;
  }, [draftItem, computedDraftChannel]);

  async function sendDraftNow() {
    if (!draftItem?.leadId) {
      setSendError("Draft is missing leadId. Please re-run the draft.");
      return;
    }
    if (!computedDraftChannel) {
      setSendError("Draft channel is missing.");
      return;
    }
    if (!computedSendTo) {
      setSendError("No recipient address found (lead has no email/phone for this channel).");
      return;
    }

    const body = (draftBody || "").trim();
    const subject = (draftSubject || "").trim();

    if (!body) {
      setSendError("Message body is empty.");
      return;
    }
    if (computedDraftChannel === "email" && !subject) {
      setSendError("Email subject is required.");
      return;
    }

    setSending(true);
    setSendError(null);
    setSendResult(null);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: Number(draftItem.leadId),
          channel: computedDraftChannel,
          to: computedSendTo,
          subject: computedDraftChannel === "email" ? subject : undefined,
          body,
          meta: {
            source: "command_center",
            draft_variant_id: draftVariantId,
            intent: "draft_reply",
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || `Send failed with ${res.status}`);

      setSendResult(json);
    } catch (err) {
      console.error("[/platform/ask] send error:", err);
      setSendError(err.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  // Render helpers
  const leadRows = useMemo(() => {
    if (!isLeadList) return [];
    return (result.items || []).map((item) => {
      const leadId = item.leadId || item.lead_id || item.id || null;
      const inboxLeadId = item.inboxLeadId || null;
      const name = item.name || item.email || item.phone || `Lead ${leadId || ""}`;
      const phone = item.phone || null;
      const email = item.email || null;
      const source = item.source || "unknown";
      const status = item.status || "new";
      const lastContactAt = item.lastContactAt || item.last_contact_at || null;
      const lastMissedCallAt = item.lastMissedCallAt || item.last_missed_call_at || null;
      const missedCallCount = item.missedCallCount || item.missed_call_count || 0;

      return {
        key: `${inboxLeadId || "x"}-${leadId || name}`,
        leadId,
        name,
        phone,
        email,
        source,
        status,
        lastContactAt,
        lastMissedCallAt,
        missedCallCount,
        raw: item,
      };
    });
  }, [isLeadList, result]);

  const tasks = useMemo(() => {
    if (!isTaskList) return [];
    return (result.items || []).map((t) => ({
      id: t.id,
      leadId: t.leadId || t.lead_id,
      followupType: t.followupType || t.followup_type || "general",
      scheduledFor: t.scheduledFor || t.scheduled_for || null,
      status: t.status || "open",
      note: t.note || null,
      createdAt: t.createdAt || t.created_at || null,
      raw: t,
    }));
  }, [isTaskList, result]);

  // Example chips
  const examples = [
    { label: "Summarize a lead", q: "Summarize Marc's conversation" },
    { label: "No reply 24h", q: "Which leads haven't replied in 24h?" },
    { label: "Missed calls", q: "Show missed calls without follow-up." },
    { label: "Tasks due today", q: "Show tasks due today." },
    { label: "Draft reply", q: "Draft an email reply to confirm the follow-up for lead #1" },
    { label: "Open tasks", q: "Show open tasks" },
  ];

  return (
    <DashboardLayout title="Command Center">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Command Center</h1>
            <p className="text-sm text-slate-400 mt-0.5">Ask anything about your leads and tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <SavedDropdown
              saved={saved}
              onApply={applyPrompt}
              onRemove={removeSaved}
              onSave={saveCurrentPrompt}
              question={question}
            />
            <button
              onClick={() => setHistoryOpen(true)}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-sky-500/40 hover:text-sky-200"
            >
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>

        {/* Query composer */}
        <div className="rounded-2xl border border-sky-700/40 bg-slate-950/80 p-5 shadow-[0_0_24px_rgba(56,189,248,0.15)]">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {loading ? "Thinking\u2026" : "Ask"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

          {/* Example chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex.label}
                onClick={() => applyPrompt(ex.q)}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300 hover:border-sky-500/40 hover:text-sky-200 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Summary (system note) */}
        {result?.aiSummary && !isConversationSummary && !isDraftReply && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
            <p className="text-sm text-slate-300 whitespace-pre-line">{truncateText(result.aiSummary, 520)}</p>
          </div>
        )}

        {/* Results area */}
        {loading && <LoadingSkeleton />}

        {!result && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-100">Ready to assist</p>
            <p className="text-sm text-slate-400 mt-1">Ask a question or pick an example above to get started.</p>
          </div>
        )}

        {isEcho && <ResultEcho />}

        {isDraftReply && (
          <ResultDraft
            result={result}
            draftItem={draftItem}
            computedDraftChannel={computedDraftChannel}
            computedSendTo={computedSendTo}
            draftSubject={draftSubject}
            setDraftSubject={setDraftSubject}
            draftBody={draftBody}
            setDraftBody={setDraftBody}
            draftChannelOverride={draftChannelOverride}
            setDraftChannelOverride={setDraftChannelOverride}
            draftVariantId={draftVariantId}
            applyVariant={applyVariant}
            sending={sending}
            sendDraftNow={sendDraftNow}
            sendError={sendError}
            sendResult={sendResult}
          />
        )}

        {isConversationSummary && (
          <ResultSummary
            result={result}
            convoItem={convoItem}
            onCreateTask={quickCreateTask}
            onDraft={quickDraftReply}
          />
        )}

        {isLeadList && (
          <ResultLeadList
            result={result}
            leadRows={leadRows}
            onSummarize={quickSummarizeLead}
            onDraft={quickDraftReply}
          />
        )}

        {isTaskList && <ResultTaskList result={result} tasks={tasks} />}

        {(isTaskCreated || isTaskUpdated) && (
          <ResultTaskConfirm result={result} isCreated={isTaskCreated} />
        )}

        {isActionOther && <ResultOther result={result} />}
      </div>

      {/* History slide-over */}
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onReuse={(q) => { applyPrompt(q); setHistoryOpen(false); }}
        onView={(raw) => { setResult(raw); setHistoryOpen(false); }}
        onClear={clearHistory}
      />
    </DashboardLayout>
  );
}
