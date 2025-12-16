// pages/platform/overview.js
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import StatCard from "../../src/components/dashboard/StatCard";

// Helper: convert ISO timestamp → "3 min ago"
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

function truncateText(str, max = 1200) {
  const s = (str || "").toString().replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

const STORAGE_KEY = "bluewise_overview_chat_v1";
const ACTIVE_LEAD_KEY = "bluewise_overview_active_lead_v1";

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Heuristic: when user uses pronouns / vague references, inject active lead context
function needsLeadContext(q) {
  const s = (q || "").toLowerCase();

  // If the user already specified a lead explicitly, don't inject
  if (/\blead\s*#?\s*\d+\b/.test(s)) return false; // "lead 19" / "lead #19"
  if (/\b(id|lead_id)\s*[:=]\s*\d+\b/.test(s)) return false;

  // “vague reference” triggers
  const pronouns =
    /\b(her|him|them|this lead|that lead|this customer|that customer|for her|for him|for them)\b/.test(
      s
    );

  // “task intent” triggers
  const taskIntent =
    /\b(follow[\s-]?up|followup|schedule|reschedule|move|cancel|complete|mark.*done|task|rappel|suivi|déplace|annule|compl[eé]t[eé])\b/.test(
      s
    );

  return pronouns || taskIntent;
}

function injectLeadContext(q, activeLead) {
  if (!activeLead?.leadId) return q;
  if (!needsLeadContext(q)) return q;

  const name = activeLead.name ? ` (${activeLead.name})` : "";
  return `For lead #${activeLead.leadId}${name}: ${q}`;
}

// -----------------------------
// Phase 4 helper: normalize draft variants
// Supports both legacy string drafts and structured drafts:
//   Email: { subject, body }
//   SMS: { body }
// -----------------------------
function normalizeDraftVariant(v) {
  if (!v) return null;

  // Structured variant
  if (typeof v === "object") {
    const subject = typeof v.subject === "string" ? v.subject.trim() : null;
    const body =
      typeof v.body === "string"
        ? v.body
        : typeof v.text === "string"
        ? v.text
        : "";
    return {
      subject: subject || null,
      body: truncateText(body, 2200),
    };
  }

  // Legacy string
  if (typeof v === "string") {
    return {
      subject: null,
      body: truncateText(v, 2200),
    };
  }

  return null;
}

// Build a human-friendly assistant “display payload” from /api/ask result
function normalizeAskResultForChat(askResult) {
  if (!askResult) {
    return { kind: "text", text: "No result." };
  }

  const { intent, resultType, title, aiSummary, items } = askResult || {};

  // Conversation summary
  if (resultType === "conversation_summary") {
    const item = items?.[0] || {};
    const summary = item.summary || aiSummary || "";
    const nextSteps = Array.isArray(item.nextSteps)
      ? item.nextSteps.filter(Boolean)
      : [];
    const openQuestions = Array.isArray(item.openQuestions)
      ? item.openQuestions.filter(Boolean)
      : [];
    const leadId = item.leadId || null;

    // Draft logic (optional): tolerate multiple backend key names
    const draftReply =
      item.draftReply ||
      item.draft_reply ||
      item.draft ||
      item.replyDraft ||
      item.reply_draft ||
      null;

    return {
      kind: "conversation_summary",
      title: title || "Conversation summary",
      summary: truncateText(summary, 1600),
      nextSteps: nextSteps.slice(0, 6),
      openQuestions: openQuestions.slice(0, 6),
      leadId,
      metaLine: aiSummary || null,
      leadName: item.leadName || null,
      draftReply: draftReply ? truncateText(draftReply, 2200) : null,
    };
  }

  // Draft reply tool result (resultType === "draft_reply")
  if (resultType === "draft_reply") {
    const item = items?.[0] || {};

    // Prefer structured variants array if backend provides it
    const rawVariants =
      Array.isArray(item.variants) && item.variants.length
        ? item.variants
        : [
            item.draft || null,
            item.draftAlt || null,
            item.draftAlt2 || null,
            // tolerate future key variants:
            item.draft_reply || null,
            item.draftReply || null,
          ].filter(Boolean);

    const variants = rawVariants
      .map(normalizeDraftVariant)
      .filter(Boolean)
      // de-dupe by body+subject
      .filter((v, idx, arr) => {
        const key = `${v.subject || ""}|||${v.body || ""}`;
        return (
          arr.findIndex((x) => `${x.subject || ""}|||${x.body || ""}` === key) ===
          idx
        );
      });

    return {
      kind: "draft_reply",
      title: title || "Draft reply",
      leadId: item.leadId || item.lead_id || null,
      leadName: item.leadName || item.lead_name || null,
      channel: item.channel || null, // sms/email
      purpose: item.purpose || null,
      suggestedSendTo: item.suggestedSendTo || null,
      scheduledForLocal: item.scheduledForLocal || null,
      variants,
      metaLine: aiSummary || null,
    };
  }

  // Lead list
  if (resultType === "lead_list") {
    const list = Array.isArray(items) ? items : [];
    return {
      kind: "lead_list",
      title: title || "Results",
      count: list.length,
      items: list.slice(0, 20).map((item) => ({
        name: item.name || item.email || item.phone || "Lead",
        phone: item.phone || null,
        email: item.email || null,
        source: item.source || "unknown",
        leadId: item.leadId || item.lead_id || null,
        inboxLeadId: item.inboxLeadId || item.id || null,
        status: item.status || null,
        lastContactAt: item.lastContactAt || null,
      })),
      metaLine: aiSummary || null,
    };
  }

  // Tasks / other actions
  if (intent && intent !== "echo") {
    const text = aiSummary || "Done.";
    return {
      kind: "action",
      title: title || "Result",
      text: truncateText(text, 1400),
      raw: askResult,
    };
  }

  // Echo fallback
  return {
    kind: "text",
    title: title || null,
    text:
      askResult.message ||
      aiSummary ||
      "Ask BlueWise is wired, but this question didn’t match any pattern yet.",
    raw: askResult,
  };
}

function ChatBubble({ role, children, meta }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-sky-500/20 border border-sky-500/30 text-slate-50"
            : "bg-slate-950/60 border border-slate-800/80 text-slate-100",
        ].join(" ")}
      >
        {children}
        {meta ? (
          <p suppressHydrationWarning className="mt-2 text-[11px] text-slate-500">
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AssistantCard({
  payload,
  activeLeadId,
  onPickLead,
  onUseDraft,
  onSendDraft, // ✅ Phase 4
  mounted,
}) {
  // ✅ FIX: Hooks must be called unconditionally (build was failing)
  const [sendingKey, setSendingKey] = useState(null); // e.g. "dr-0"
  const [sendNotice, setSendNotice] = useState(null); // { type: 'ok'|'err', text }

  if (!payload) return null;

  async function copyToClipboard(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // Fallback: best effort
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }
  }

  async function handleSendVariant(variant, idx) {
    if (!onSendDraft) return;

    const channel = payload.channel;
    const leadId = payload.leadId;
    const to = payload.suggestedSendTo;

    if (!leadId || !channel || !to) {
      setSendNotice({ type: "err", text: "Missing lead/channel/to for sending." });
      return;
    }

    if (channel === "email" && !variant?.subject) {
      setSendNotice({
        type: "err",
        text: "Email subject missing. Re-draft and try again.",
      });
      return;
    }

    const key = `dr-${idx}`;
    setSendingKey(key);
    setSendNotice(null);

    const result = await onSendDraft({
      lead_id: Number(leadId),
      channel,
      to,
      subject: channel === "email" ? variant.subject : undefined,
      body: variant.body,
      meta: {
        source: "overview-chat",
        variant_index: idx,
        purpose: payload.purpose || null,
      },
    });

    if (result?.success) {
      setSendNotice({ type: "ok", text: "Sent successfully." });
    } else {
      setSendNotice({
        type: "err",
        text: result?.error || "Send failed. Check server logs / send_logs.",
      });
    }

    setSendingKey(null);
  }

  if (payload.kind === "conversation_summary") {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-50">{payload.title}</p>

        {payload.summary ? (
          <p className="mt-1 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {payload.summary}
          </p>
        ) : null}

        {(payload.nextSteps?.length || 0) > 0 ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-200">
              Next steps
            </p>
            <ul className="mt-1 list-disc pl-4 text-[12px] text-slate-200 space-y-1">
              {payload.nextSteps.map((s, i) => (
                <li key={`ns-${i}`}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {(payload.openQuestions?.length || 0) > 0 ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-200">
              Open questions
            </p>
            <ul className="mt-1 list-disc pl-4 text-[12px] text-slate-200 space-y-1">
              {payload.openQuestions.map((s, i) => (
                <li key={`oq-${i}`}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Draft reply block (optional) */}
        {payload.draftReply ? (
          <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-slate-200">
                Draft reply
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(payload.draftReply)}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => onUseDraft?.(payload.draftReply)}
                  className="rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-medium text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                >
                  Use
                </button>
              </div>
            </div>

            <p className="mt-2 text-[12px] text-slate-200 whitespace-pre-wrap leading-relaxed">
              {payload.draftReply}
            </p>

            <p className="mt-2 text-[11px] text-slate-500">
              Tip: Click “Use” to drop this into the input box, then edit and
              send.
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          {payload.leadId ? (
            <div className="flex items-center gap-2">
              {/* ✅ FIX: Use Link instead of <a> (Next ESLint build blocker) */}
              <Link
                href={`/platform/leads/${payload.leadId}`}
                className="inline-flex items-center rounded-xl border border-sky-500/60 px-3 py-1.5 text-[12px] font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
              >
                View lead
              </Link>

              <button
                type="button"
                onClick={() =>
                  onPickLead?.({
                    leadId: payload.leadId,
                    name: payload.leadName || null,
                  })
                }
                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[12px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
              >
                Set active
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">No lead link</span>
          )}

          <span className="text-[11px] text-slate-500">
            {payload.metaLine ? payload.metaLine : ""}
          </span>
        </div>

        {payload.leadId && activeLeadId === payload.leadId ? (
          <p className="mt-2 text-[11px] text-sky-200">Active lead selected</p>
        ) : null}
      </div>
    );
  }

  // Render draft_reply results from the dedicated tool
  if (payload.kind === "draft_reply") {
    const variants = Array.isArray(payload.variants) ? payload.variants : [];
    const channel = payload.channel || null;

    return (
      <div>
        <p className="text-xs font-semibold text-slate-50">{payload.title}</p>

        <p className="mt-1 text-[12px] text-slate-400">
          {channel ? channel.toUpperCase() : "MSG"}
          {payload.suggestedSendTo ? (
            <span className="text-slate-500"> · to {payload.suggestedSendTo}</span>
          ) : null}
          {payload.scheduledForLocal ? (
            <span className="text-slate-500">
              {" "}
              · follow-up {payload.scheduledForLocal}
            </span>
          ) : null}
        </p>

        {sendNotice ? (
          <div
            className={[
              "mt-3 rounded-xl border px-3 py-2 text-[12px]",
              sendNotice.type === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200",
            ].join(" ")}
          >
            {sendNotice.text}
          </div>
        ) : null}

        {variants.length ? (
          <div className="mt-3 space-y-3">
            {variants.map((v, i) => {
              const canSend =
                !!payload.leadId &&
                !!channel &&
                !!payload.suggestedSendTo &&
                (channel !== "email" || !!v?.subject) &&
                !!v?.body;

              const isSending = sendingKey === `dr-${i}`;

              // Copy text: for email include subject line
              const copyText =
                channel === "email"
                  ? `Subject: ${v.subject || ""}\n\n${v.body || ""}`
                  : v.body || "";

              return (
                <div
                  key={`dr-${i}`}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-slate-200">
                      Draft variant {i + 1}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(copyText)}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => onUseDraft?.(copyText)}
                        className="rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-medium text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                      >
                        Use
                      </button>

                      {/* ✅ Phase 4: Deterministic Send */}
                      <button
                        type="button"
                        disabled={!canSend || isSending}
                        onClick={() => handleSendVariant(v, i)}
                        title={
                          canSend
                            ? "Send via /api/send"
                            : channel === "email" && !v?.subject
                            ? "Email subject missing (re-draft)"
                            : !payload.suggestedSendTo
                            ? "Missing recipient (suggestedSendTo)"
                            : "Missing required send fields"
                        }
                        className={[
                          "rounded-lg px-2 py-1 text-[11px] font-semibold",
                          canSend && !isSending
                            ? "border border-emerald-500/60 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100 hover:bg-emerald-500/10"
                            : "border border-slate-700 text-slate-400 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {isSending ? "Sending…" : "Send"}
                      </button>
                    </div>
                  </div>

                  {/* Email subject line (if present) */}
                  {channel === "email" && v?.subject ? (
                    <p className="mt-2 text-[12px] text-slate-100">
                      <span className="text-slate-400">Subject:</span>{" "}
                      <span className="font-semibold">{v.subject}</span>
                    </p>
                  ) : null}

                  <p className="mt-2 text-[12px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {v?.body || "—"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-slate-400">No draft returned.</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          {payload.leadId ? (
            <div className="flex items-center gap-2">
              {/* ✅ FIX: Use Link instead of <a> (Next ESLint build blocker) */}
              <Link
                href={`/platform/leads/${payload.leadId}`}
                className="inline-flex items-center rounded-xl border border-sky-500/60 px-3 py-1.5 text-[12px] font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
              >
                View lead
              </Link>

              <button
                type="button"
                onClick={() =>
                  onPickLead?.({
                    leadId: payload.leadId,
                    name: payload.leadName || null,
                  })
                }
                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[12px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
              >
                Set active
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">No lead link</span>
          )}

          <span className="text-[11px] text-slate-500">
            {payload.metaLine ? payload.metaLine : ""}
          </span>
        </div>

        {payload.leadId && activeLeadId === payload.leadId ? (
          <p className="mt-2 text-[11px] text-sky-200">Active lead selected</p>
        ) : null}
      </div>
    );
  }

  if (payload.kind === "lead_list") {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-50">{payload.title}</p>
          <span className="text-[11px] text-slate-500">
            {payload.count} item{payload.count === 1 ? "" : "s"}
          </span>
        </div>

        {payload.metaLine ? (
          <p className="mt-1 text-[12px] text-slate-300">{payload.metaLine}</p>
        ) : null}

        {payload.items?.length ? (
          <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">
            {payload.items.map((it, idx) => {
              const isActive = !!it.leadId && it.leadId === activeLeadId;
              return (
                <li
                  key={`${it.inboxLeadId || "row"}-${it.leadId || idx}`}
                  className={`px-3 py-2 ${isActive ? "bg-sky-500/10" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        it.leadId && onPickLead?.({ leadId: it.leadId, name: it.name })
                      }
                      className="min-w-0 text-left"
                      title={it.leadId ? "Set as active lead" : "Unlinked lead"}
                    >
                      <p className="truncate text-sm text-slate-100">
                        {it.name}{" "}
                        {isActive ? (
                          <span className="ml-2 text-[11px] text-sky-200">
                            (active)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {it.phone ? <span>{it.phone}</span> : null}
                        {it.phone && it.email ? <span> · </span> : null}
                        {it.email ? <span>{it.email}</span> : null}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {it.source}
                        {it.lastContactAt && mounted ? (
                          <span className="ml-2">
                            · last contact {formatTimeAgo(it.lastContactAt)}
                          </span>
                        ) : null}
                      </p>
                    </button>

                    <div className="shrink-0 flex items-center gap-2">
                      {it.leadId ? (
                        <>
                          {/* ✅ FIX: Use Link instead of <a> (Next ESLint build blocker) */}
                          <Link
                            href={`/platform/leads/${it.leadId}`}
                            className="rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-medium text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              onPickLead?.({ leadId: it.leadId, name: it.name })
                            }
                            className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                          >
                            Set
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">Unlinked</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-[12px] text-slate-400">No matching leads found.</p>
        )}
      </div>
    );
  }

  if (payload.kind === "action") {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-50">{payload.title}</p>
        <p className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">
          {payload.text}
        </p>
      </div>
    );
  }

  return (
    <div>
      {payload.title ? (
        <p className="text-xs font-semibold text-slate-50">{payload.title}</p>
      ) : null}
      <p className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">
        {payload.text || "—"}
      </p>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydration-safe mount flag + "storage loaded" flag
  const [mounted, setMounted] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  // Chat state
  const [input, setInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);

  // Active lead memory (persisted) - SSR-safe initial state
  const [activeLead, setActiveLead] = useState(null);

  // messages: [{ id, role: 'user'|'assistant', text?, payload?, createdAt }]
  // SSR-safe initial state
  const [chat, setChat] = useState([]);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // derive last conversation summary from chat history
  const lastSummary = useMemo(() => {
    for (let i = chat.length - 1; i >= 0; i--) {
      const m = chat[i];
      if (m?.role === "assistant" && m?.payload?.kind === "conversation_summary") {
        const p = m.payload;
        if (!p?.leadId) continue;

        return {
          leadId: Number(p.leadId),
          summary: typeof p.summary === "string" ? p.summary : "",
          leadName: p.leadName || null,
        };
      }
    }
    return null;
  }, [chat]);

  // Client-only: load localStorage AFTER hydration
  useEffect(() => {
    setMounted(true);

    try {
      const rawChat = window.localStorage.getItem(STORAGE_KEY);
      const parsedChat = rawChat ? safeJsonParse(rawChat, []) : [];
      if (Array.isArray(parsedChat)) setChat(parsedChat);

      const rawLead = window.localStorage.getItem(ACTIVE_LEAD_KEY);
      const parsedLead = rawLead ? safeJsonParse(rawLead, null) : null;
      if (parsedLead?.leadId) setActiveLead(parsedLead);
    } catch (e) {
      console.warn("[Overview] localStorage load failed:", e);
    } finally {
      setStorageReady(true);
    }
  }, []);

  // Persist chat
  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
    } catch (e) {
      console.warn("[Overview] localStorage save chat failed:", e);
    }
  }, [chat, storageReady]);

  // Persist active lead
  useEffect(() => {
    if (!storageReady) return;
    try {
      if (activeLead?.leadId) {
        window.localStorage.setItem(ACTIVE_LEAD_KEY, JSON.stringify(activeLead));
      } else {
        window.localStorage.removeItem(ACTIVE_LEAD_KEY);
      }
    } catch (e) {
      console.warn("[Overview] localStorage save activeLead failed:", e);
    }
  }, [activeLead, storageReady]);

  // Auto scroll to bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat, askLoading]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/overview");
        if (!res.ok) throw new Error(`Failed to load overview: ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = data?.kpis || {};
  const hasChatHistory = chat.length > 0;

  const quickPrompts = useMemo(
    () => [
      "Summarize Marc’s conversation",
      "Show missed calls without follow-up",
      "Leads no reply 24h",
      "Show open tasks due today",
    ],
    []
  );

  function pushUserMessage(text) {
    setChat((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: "user",
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function pushAssistantMessage(payload, rawTextFallback) {
    // Auto-set active lead when assistant returns a concrete leadId (summary)
    if (payload?.kind === "conversation_summary" && payload?.leadId) {
      setActiveLead((prev) => {
        if (prev?.leadId === payload.leadId) return prev;
        return { leadId: payload.leadId, name: payload.leadName || null };
      });
    }

    // Also auto-set active lead when draft_reply returns a leadId
    if (payload?.kind === "draft_reply" && payload?.leadId) {
      setActiveLead((prev) => {
        if (prev?.leadId === payload.leadId) return prev;
        return { leadId: payload.leadId, name: payload.leadName || null };
      });
    }

    setChat((prev) => [
      ...prev,
      {
        id: `a_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: "assistant",
        payload,
        text: rawTextFallback || null,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function useDraft(draftText) {
    if (!draftText) return;
    setInput(draftText);
    setTimeout(() => {
      inputRef.current?.focus();
      try {
        const el = inputRef.current;
        if (el && typeof el.setSelectionRange === "function") {
          const len = draftText.length;
          el.setSelectionRange(len, len);
        }
      } catch {}
    }, 50);
  }

  // ✅ Phase 4: deterministic sender (UI-triggered only)
  async function sendViaApiSend(payload) {
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: json.error || `Send failed with ${res.status}`,
        };
      }

      // Add a small assistant confirmation message into chat
      pushAssistantMessage(
        {
          kind: "action",
          title: "Sent",
          text: `✅ ${payload.channel?.toUpperCase()} sent to ${payload.to}. (provider: ${json.provider})`,
        },
        null
      );

      return { success: true, ...json };
    } catch (e) {
      return { success: false, error: e?.message || "Send failed" };
    }
  }

  async function askBlueWise(questionRaw) {
    setAskLoading(true);
    setAskError(null);

    const question = injectLeadContext(questionRaw, activeLead);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          activeLeadId: activeLead?.leadId ? Number(activeLead.leadId) : null,
          lastSummary: lastSummary
            ? {
                leadId: Number(lastSummary.leadId),
                summary: lastSummary.summary || "",
                leadName: lastSummary.leadName || null,
              }
            : null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error || json.details || `Ask failed with ${res.status}`
        );
      }

      const payload = normalizeAskResultForChat(json);
      pushAssistantMessage(payload, null);
    } catch (err) {
      console.error("[Overview Chat] Ask error:", err);
      setAskError(err.message || "Failed to answer question.");

      pushAssistantMessage(
        {
          kind: "action",
          title: "Error",
          text: err.message || "Failed to answer question.",
        },
        null
      );
    } finally {
      setAskLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || askLoading) return;

    setInput("");
    pushUserMessage(q);
    await askBlueWise(q);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleQuickPrompt(p) {
    if (askLoading) return;
    setInput("");
    pushUserMessage(p);
    askBlueWise(p);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function clearChat() {
    setChat([]);
    setAskError(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function clearActiveLead() {
    setActiveLead(null);
  }

  function pickLead(lead) {
    if (!lead?.leadId) return;
    setActiveLead({ leadId: lead.leadId, name: lead.name || null });

    pushAssistantMessage(
      {
        kind: "action",
        title: "Active lead set",
        text: `Now talking about lead #${lead.leadId}${
          lead.name ? ` (${lead.name})` : ""
        }.`,
      },
      null
    );
  }

  return (
    <DashboardLayout title="Overview">
      {/* KPI row */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="New leads"
          subLabel="Created in the last 7 days"
          value={
            loading
              ? "…"
              : kpis.newLeadsThisWeek != null
              ? kpis.newLeadsThisWeek
              : "--"
          }
        />
        <StatCard
          label="Open tasks"
          subLabel="Follow-ups not completed yet"
          value={loading ? "… " : kpis.openTasks ?? "--"}
        />
        <StatCard
          label="Tasks due today"
          subLabel="Scheduled for today"
          value={loading ? "… " : kpis.tasksDueToday ?? "--"}
        />
        <StatCard
          label="Overdue tasks"
          subLabel="Due date is in the past"
          value={loading ? "… " : kpis.tasksOverdue ?? "--"}
        />
        <StatCard
          label="Missed calls"
          subLabel="In the last 7 days"
          value={loading ? "… " : kpis.missedCallsThisWeek ?? "--"}
        />
        <StatCard
          label="AI replies"
          subLabel="Auto SMS replies in the last 7 days"
          value={loading ? "… " : kpis.aiRepliesThisWeek ?? "--"}
        />
      </div>

      {/* Chat Panel */}
      <div className="rounded-2xl border border-sky-700/40 bg-slate-950/80 shadow-[0_0_28px_rgba(56,189,248,0.22)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-50">BlueWise Chat</p>
            <p className="text-[11px] text-slate-400">
              Ask about leads, missed calls, conversations, and follow-ups.
            </p>

            {mounted && activeLead?.leadId ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-200">
                  Active: {activeLead.name ? activeLead.name : "Lead"} #
                  {activeLead.leadId}
                </span>

                {/* ✅ FIX: Use Link instead of <a> */}
                <Link
                  href={`/platform/leads/${activeLead.leadId}`}
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                >
                  Open
                </Link>

                <button
                  type="button"
                  onClick={clearActiveLead}
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-rose-500/40 hover:text-rose-200 hover:bg-rose-500/10"
                >
                  Clear active
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500">
                Tip: Summarize a lead or click “Set” on a lead result to lock
                context.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ FIX: Use Link instead of <a> (Next ESLint build blocker) */}
            <Link
              href="/platform/ask"
              className="hidden sm:inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
              title="Optional full Command Center (we can build it next)"
            >
              Command Center
            </Link>

            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-rose-500/40 hover:text-rose-200 hover:bg-rose-500/10"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-rows-[1fr_auto] h-[64vh] sm:h-[68vh]">
          {/* Messages */}
          <div ref={listRef} className="px-4 py-4 overflow-y-auto space-y-3">
            {!hasChatHistory ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-slate-50">
                  Start with a quick prompt
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  BlueWise will query your database (no guessing) and return
                  actionable answers.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleQuickPrompt(p)}
                      className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[12px] text-slate-200 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {chat.map((m) => {
              const ts = mounted && m.createdAt ? formatTimeAgo(m.createdAt) : null;

              if (m.role === "user") {
                return (
                  <ChatBubble key={m.id} role="user" meta={ts}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </ChatBubble>
                );
              }

              return (
                <ChatBubble key={m.id} role="assistant" meta={ts}>
                  {m.payload ? (
                    <AssistantCard
                      payload={m.payload}
                      activeLeadId={activeLead?.leadId || null}
                      onPickLead={pickLead}
                      onUseDraft={useDraft}
                      onSendDraft={sendViaApiSend} // ✅ Phase 4
                      mounted={mounted}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.text || "—"}</p>
                  )}
                </ChatBubble>
              );
            })}

            {askLoading ? (
              <ChatBubble role="assistant">
                <p className="text-sm text-slate-200">Thinking…</p>
              </ChatBubble>
            ) : null}

            {askError ? (
              <div className="text-[12px] text-rose-300">{askError}</div>
            ) : null}
          </div>

          {/* Input */}
          <div className="border-t border-slate-800/80 bg-slate-950/40 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="sr-only">Message</label>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Try: "Summarize Marc’s conversation" or "Schedule a follow-up tomorrow 3pm"'
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Enter to send · Shift+Enter for newline · Remembers Active lead
                  + chat on this device
                </p>
              </div>

              <button
                type="submit"
                disabled={askLoading || !input.trim()}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {askLoading ? "…" : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-xs text-red-400">Error loading overview: {error}</p>
      ) : null}
    </DashboardLayout>
  );
}
