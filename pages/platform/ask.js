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
  return s.slice(0, max - 1) + "…";
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

function StatusPill({ label, tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        badgeTone(tone || label)
      )}
    >
      {label}
    </span>
  );
}

function SectionTitle({ children }) {
  return <p className="text-[11px] font-semibold text-slate-200">{children}</p>;
}

function EmptyState({ title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {desc ? <p className="mt-1 text-xs text-slate-400">{desc}</p> : null}
    </div>
  );
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
// Main page
// -----------------------------
export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [tab, setTab] = useState("result"); // result | history
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState([]);

  const [mode, setMode] = useState("auto"); // auto | leads | summary | tasks
  const inputRef = useRef(null);

  useEffect(() => {
    setHistory(loadJson(LS_HISTORY, []));
    setSaved(
      loadJson(LS_SAVED, [
        { id: "s1", label: "Summarize a lead", q: "Summarize Marc’s conversation" },
        { id: "s2", label: "No reply 24h", q: "Which leads haven't replied in 24h?" },
        { id: "s3", label: "Missed calls no follow-up", q: "Show missed calls without follow-up." },
        { id: "s4", label: "Tasks due today", q: "Show tasks due today." },
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
  const isActionOther =
    result &&
    intent !== "echo" &&
    resultType &&
    !isLeadList &&
    !isConversationSummary &&
    !isTaskList &&
    !isTaskCreated &&
    !isTaskUpdated;

  const convoItem = isConversationSummary ? result.items?.[0] : null;

  // --- smart “ask” -----------------------------------
  async function runAsk(q) {
    const cleaned = (q || "").trim();
    if (!cleaned) return;

    setLoading(true);
    setError(null);

    try {
      // Optional “mode hints”: keep it light. Your backend still decides via tools.
      // We just prepend a short hint so the model tends to call the right tool.
      const hint =
        mode === "leads"
          ? "INTENT: list leads.\n"
          : mode === "summary"
          ? "INTENT: summarize conversation.\n"
          : mode === "tasks"
          ? "INTENT: tasks.\n"
          : "";

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: hint + cleaned }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || `Ask failed with ${res.status}`);

      setResult(json);
      setTab("result");

      // History item (keeps output lightweight)
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toISOString(),
        q: cleaned,
        intent: json.intent || null,
        resultType: json.resultType || null,
        title: json.title || null,
        aiSummary: json.aiSummary || null,
        // small snapshot for browsing
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
    const label = q.length > 40 ? q.slice(0, 40) + "…" : q;
    setSaved((prev) => [{ id, label, q }, ...prev].slice(0, 12));
  }

  function removeSaved(id) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  function clearHistory() {
    setHistory([]);
    saveJson(LS_HISTORY, []);
  }

  // --- “power actions” built on your existing /api/ask tools -----------
  function quickSummarizeLead(leadId) {
    runAsk(`Summarize the conversation for lead #${leadId}`);
  }

  function quickCreateTask(leadId, followupType) {
    // Let the backend choose time if not specified.
    // Your backend will default to tomorrow 09:00 if model doesn't provide a date.
    runAsk(
      `Create a ${followupType} follow-up for lead #${leadId} tomorrow at 9:00. Note: Auto-created from Command Center.`
    );
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

  return (
    <DashboardLayout title="Command Center">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left column: controls + saved prompts */}
        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Ask BlueWise Command Center</p>
                <p className="mt-1 text-xs text-slate-400">
                  Natural language → deterministic tools → structured results.
                </p>
              </div>

              {/* ✅ FIX: internal navigation uses Link */}
              <Link
                href="/platform/overview"
                className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
              >
                Back to overview
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setMode("auto")}
                className={cx(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold",
                  mode === "auto"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                    : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
                )}
              >
                Auto
              </button>
              <button
                onClick={() => setMode("leads")}
                className={cx(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold",
                  mode === "leads"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                    : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
                )}
              >
                Leads
              </button>
              <button
                onClick={() => setMode("summary")}
                className={cx(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold",
                  mode === "summary"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                    : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
                )}
              >
                Summaries
              </button>
              <button
                onClick={() => setMode("tasks")}
                className={cx(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold",
                  mode === "tasks"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                    : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
                )}
              >
                Tasks
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <SectionTitle>Examples</SectionTitle>
              <div className="mt-2 flex flex-col gap-2">
                {[
                  `Summarize Marc’s conversation`,
                  `Show missed calls without follow-up`,
                  `Which leads haven't replied in 24h?`,
                  `Create a call follow-up for Isabelle tomorrow at 15:00`,
                  `Show open tasks`,
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => applyPrompt(q)}
                    className="text-left text-[11px] text-slate-300 hover:text-sky-200"
                    title="Insert into prompt"
                  >
                    “{q}”
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">Saved prompts</p>
              <button
                onClick={saveCurrentPrompt}
                className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
              >
                Save current
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {saved.length === 0 ? (
                <p className="text-xs text-slate-500">No saved prompts yet.</p>
              ) : (
                saved.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <button onClick={() => applyPrompt(s.q)} className="min-w-0 text-left" title="Insert into prompt">
                      <p className="truncate text-xs font-semibold text-slate-200">{s.label}</p>
                      <p className="truncate text-[11px] text-slate-500">{s.q}</p>
                    </button>
                    <button
                      onClick={() => removeSaved(s.id)}
                      className="shrink-0 text-[11px] font-semibold text-slate-400 hover:text-rose-200"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: composer + results */}
        <div className="xl:col-span-8 space-y-4">
          {/* Composer */}
          <div className="rounded-2xl border border-sky-700/40 bg-slate-950/80 p-4 shadow-[0_0_24px_rgba(56,189,248,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Ask</p>
                <p className="mt-1 text-xs text-slate-400">
                  Output is designed to be client-ready: readable, structured, and actionable.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab("result")}
                  className={cx(
                    "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                    tab === "result"
                      ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                      : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
                  )}
                >
                  Result
                </button>
                <button
                  onClick={() => setTab("history")}
                  className={cx(
                    "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                    tab === "history"
                      ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                      : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
                  )}
                >
                  History
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='Example: "Summarize Marc’s conversation"'
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {loading ? "Thinking…" : "Ask"}
              </button>
            </form>

            {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}

            {result?.aiSummary && tab === "result" ? (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <SectionTitle>System note</SectionTitle>
                <p className="mt-1 text-xs text-slate-300 whitespace-pre-line">{truncateText(result.aiSummary, 520)}</p>
              </div>
            ) : null}
          </div>

          {/* RESULTS */}
          {tab === "result" && (
            <div className="space-y-4">
              {!result && !loading ? (
                <EmptyState title="No result yet" desc="Run a query and BlueWise will return structured CRM output." />
              ) : null}

              {isEcho ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                  <p className="text-sm font-semibold text-slate-100">Not matched yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    This question did not trigger a tool. Try a more specific request like: “Show open tasks”,
                    “Summarize Marc’s conversation”, or “Leads no reply 24h”.
                  </p>
                </div>
              ) : null}

              {/* Conversation Summary */}
              {isConversationSummary && (
                <div className="rounded-2xl border border-sky-700/30 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{result.title || "Conversation summary"}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {convoItem?.urgency ? (
                          <StatusPill label={`urgency: ${convoItem.urgency}`} tone={convoItem.urgency} />
                        ) : null}
                        {convoItem?.sentiment ? (
                          <StatusPill label={`sentiment: ${convoItem.sentiment}`} tone={convoItem.sentiment} />
                        ) : null}
                        {convoItem?.recommendedFollowUpType ? (
                          <StatusPill label={`follow-up: ${convoItem.recommendedFollowUpType}`} tone="low" />
                        ) : null}
                        {convoItem?.messageCount != null ? (
                          <StatusPill label={`${convoItem.messageCount} msg`} tone="low" />
                        ) : null}
                        {convoItem?.daysBack != null ? <StatusPill label={`${convoItem.daysBack}d`} tone="low" /> : null}
                      </div>

                      {convoItem?.summary ? (
                        <p className="mt-3 text-sm text-slate-200 leading-relaxed">{safeText(convoItem.summary)}</p>
                      ) : null}

                      {convoItem?.leadIntent ? (
                        <p className="mt-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Lead intent:</span> {safeText(convoItem.leadIntent)}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      {convoItem?.leadId ? (
                        <Link
                          href={`/platform/leads/${convoItem.leadId}`}
                          className="rounded-xl border border-sky-500/60 px-3 py-2 text-[11px] font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10 text-center"
                        >
                          Open lead
                        </Link>
                      ) : null}

                      {convoItem?.leadId ? (
                        <button
                          onClick={() =>
                            quickCreateTask(convoItem.leadId, convoItem.recommendedFollowUpType || "call")
                          }
                          className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                        >
                          Create follow-up
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Key details */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <SectionTitle>Key details</SectionTitle>
                      {(convoItem?.keyDetails || []).length ? (
                        <ul className="mt-2 list-disc pl-4 text-xs text-slate-300 space-y-1">
                          {(convoItem.keyDetails || []).slice(0, 8).map((s, i) => (
                            <li key={`kd-${i}`}>{safeText(s)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No key details extracted.</p>
                      )}
                    </div>

                    {/* Objections */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <SectionTitle>Objections</SectionTitle>
                      {(convoItem?.objections || []).length ? (
                        <ul className="mt-2 list-disc pl-4 text-xs text-slate-300 space-y-1">
                          {(convoItem.objections || []).slice(0, 8).map((s, i) => (
                            <li key={`ob-${i}`}>{safeText(s)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No objections detected.</p>
                      )}
                    </div>

                    {/* Next steps */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <SectionTitle>Next steps</SectionTitle>
                      {(convoItem?.nextSteps || []).length ? (
                        <ul className="mt-2 list-disc pl-4 text-xs text-slate-300 space-y-1">
                          {(convoItem.nextSteps || []).slice(0, 8).map((s, i) => (
                            <li key={`ns-${i}`}>{safeText(s)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No next steps proposed.</p>
                      )}
                    </div>

                    {/* Open questions */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <SectionTitle>Open questions</SectionTitle>
                      {(convoItem?.openQuestions || []).length ? (
                        <ul className="mt-2 list-disc pl-4 text-xs text-slate-300 space-y-1">
                          {(convoItem.openQuestions || []).slice(0, 8).map((s, i) => (
                            <li key={`oq-${i}`}>{safeText(s)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No open questions listed.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lead list */}
              {isLeadList && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{result.title || "Lead list"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {leadRows.length} match{leadRows.length === 1 ? "" : "es"} · ranked by latest activity.
                      </p>
                    </div>
                  </div>

                  {leadRows.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500">No matching leads.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[11px] text-slate-400 border-b border-slate-800">
                            <th className="py-2 pr-3">Lead</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 pr-3">Source</th>
                            <th className="py-2 pr-3">Last contact</th>
                            <th className="py-2 pr-3">Missed calls</th>
                            <th className="py-2 pr-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {leadRows.map((r) => (
                            <tr key={r.key} className="text-xs text-slate-200 hover:bg-slate-900/40">
                              <td className="py-2 pr-3">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-100">{r.name}</p>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {r.phone ? r.phone : ""}
                                    {r.phone && r.email ? " · " : ""}
                                    {r.email ? r.email : ""}
                                  </p>
                                </div>
                              </td>
                              <td className="py-2 pr-3">
                                <StatusPill label={r.status} tone="low" />
                              </td>
                              <td className="py-2 pr-3">
                                <span className="text-[11px] text-slate-400">{r.source}</span>
                              </td>
                              <td className="py-2 pr-3">
                                <span className="text-[11px] text-slate-300">
                                  {r.lastContactAt
                                    ? `${formatWhen(r.lastContactAt)} (${formatTimeAgo(r.lastContactAt)})`
                                    : "—"}
                                </span>
                              </td>
                              <td className="py-2 pr-3">
                                <span className="text-[11px] text-slate-300">
                                  {r.missedCallCount ? `${r.missedCallCount}` : "0"}
                                  {r.lastMissedCallAt ? (
                                    <span className="text-slate-500"> · {formatTimeAgo(r.lastMissedCallAt)}</span>
                                  ) : null}
                                </span>
                              </td>
                              <td className="py-2 pl-3">
                                <div className="flex items-center justify-end gap-2">
                                  {r.leadId ? (
                                    <Link
                                      href={`/platform/leads/${r.leadId}`}
                                      className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                                    >
                                      Open
                                    </Link>
                                  ) : (
                                    <span className="text-[11px] text-slate-500">Unlinked</span>
                                  )}

                                  {r.leadId ? (
                                    <button
                                      onClick={() => quickSummarizeLead(r.leadId)}
                                      className="rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                                    >
                                      Summarize
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Task list */}
              {isTaskList && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{result.title || "Follow-up tasks"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {tasks.length} task{tasks.length === 1 ? "" : "s"}.
                      </p>
                    </div>
                  </div>

                  {tasks.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500">No matching tasks.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {tasks.map((t) => (
                        <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-100">
                                #{t.id} · {t.followupType.toUpperCase()} ·{" "}
                                <span className="text-slate-300">
                                  {t.scheduledFor ? formatWhen(t.scheduledFor) : "No date"}
                                </span>
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                status: {t.status}
                                {t.createdAt ? ` · created ${formatTimeAgo(t.createdAt)}` : ""}
                              </p>
                              {t.note ? <p className="mt-2 text-xs text-slate-300">{safeText(t.note)}</p> : null}
                            </div>

                            {t.leadId ? (
                              <Link
                                href={`/platform/leads/${t.leadId}`}
                                className="shrink-0 rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                              >
                                Open lead
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Task created/updated confirmations */}
              {(isTaskCreated || isTaskUpdated) && (
                <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/50 p-4">
                  <p className="text-sm font-semibold text-slate-100">
                    {result.title || (isTaskCreated ? "Follow-up created" : "Follow-up updated")}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {result.items?.[0]?.leadId ? (
                      <>
                        Lead{" "}
                        <Link
                          href={`/platform/leads/${result.items[0].leadId}`}
                          className="text-sky-200 hover:text-sky-100 hover:underline underline-offset-4"
                        >
                          #{result.items[0].leadId}
                        </Link>{" "}
                        · {truncateText(result.aiSummary || "", 380)}
                      </>
                    ) : (
                      truncateText(result.aiSummary || "", 520)
                    )}
                  </p>
                </div>
              )}

              {/* Other action */}
              {isActionOther && (
                <div className="rounded-2xl border border-sky-700/30 bg-slate-950/50 p-4">
                  <p className="text-sm font-semibold text-slate-100">{result.title || "Result"}</p>
                  <p className="mt-2 text-sm text-slate-200 whitespace-pre-line">
                    {truncateText(result.aiSummary || "", 900)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">History</p>
                  <p className="mt-1 text-xs text-slate-400">Stored locally in your browser. Last 40 runs.</p>
                </div>
                <button
                  onClick={clearHistory}
                  className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-rose-500/40 hover:text-rose-200 hover:bg-rose-500/10"
                >
                  Clear
                </button>
              </div>

              {history.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500">No history yet.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-100">{h.q}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatWhen(h.at)} · {formatTimeAgo(h.at)}
                            {h.resultType ? ` · ${h.resultType}` : ""}
                            {h.intent ? ` · ${h.intent}` : ""}
                          </p>
                          {h.snapshot ? <p className="mt-2 text-xs text-slate-300">{h.snapshot}</p> : null}
                        </div>
                        <div className="shrink-0 flex flex-col gap-2">
                          <button
                            onClick={() => applyPrompt(h.q)}
                            className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                          >
                            Reuse
                          </button>
                          <button
                            onClick={() => {
                              setResult(h.raw);
                              setTab("result");
                            }}
                            className="rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
