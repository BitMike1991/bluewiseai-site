// pages/platform/leads/[id].js

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function StatusBadge({ status }) {
  if (!status)
    return <span className="px-2 py-1 rounded-full text-xs bg-slate-700/60">unknown</span>;

  const colorMap = {
    active: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
    new: "bg-sky-500/10 text-sky-300 border-sky-500/40",
    in_convo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/40",
    quoted: "bg-amber-500/10 text-amber-300 border-amber-500/40",
    won: "bg-emerald-500/15 text-emerald-200 border-emerald-500/60",
    lost: "bg-rose-500/10 text-rose-300 border-rose-500/40",
    dead: "bg-slate-600/60 text-slate-200 border-slate-500/60",
  };

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border shadow-sm shadow-slate-900/40";

  const cls = colorMap[status] || "bg-slate-700/60 text-slate-200 border-slate-500/60";
  return <span className={`${base} ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

function getEventLabelAndDescription(event) {
  const type = (event.type || "").toLowerCase();

  if (type.includes("call")) {
    if (type.includes("miss")) {
      return {
        label: "Missed call",
        description: "Incoming call was missed. Your AI may have followed up by SMS.",
      };
    }
    if (type.includes("hangup")) {
      return { label: "Call ended", description: "Call ended. Check call log for more details." };
    }
    if (type.includes("initiated")) {
      return { label: "Call started", description: "Call was initiated via Telnyx." };
    }
    return { label: "Call event", description: type };
  }

  if (type.includes("cold") && type.includes("sent")) {
    return { label: "Cold email sent", description: "Cold outreach step was sent to this lead." };
  }

  if (type.includes("followup") && type.includes("created")) {
    return { label: "Follow-up task created", description: "Automation created a follow-up task for this lead." };
  }

  if (type.includes("ai") && type.includes("reply")) {
    return { label: "AI reply generated", description: "Your AI assistant drafted or sent a reply." };
  }

  return { label: "Event", description: type || "Lead event logged by automation." };
}

function truncateText(str, max = 900) {
  const s = (str || "").toString();
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

// ✅ robust channel classification
function classifyChannel(channelValue) {
  const s = (channelValue || "").toString().toLowerCase();

  if (s === "email" || s.includes("email") || s.includes("mailgun") || s.includes("gmail") || s.includes("smtp"))
    return "email";

  if (s === "sms" || s.includes("sms") || s.includes("telnyx") || s.includes("text")) return "sms";

  return s || "unknown";
}

// ✅ UI-safe email cleanup to prevent “huge blank space” + signature preview cut
function normalizeMessageBody(raw) {
  if (!raw) return "";
  let s = raw.toString();
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.trim();
  return s;
}

// Heuristic: signature separators (preview only)
function splitSignaturePreview(body) {
  const s = body || "";
  if (!s) return { preview: "", hasSig: false };

  const sigRegex =
    /(\n--\s*\n|\n—\s*\n|\n___+\s*\n|\nSent from my (iPhone|Android).*\n|\nBest regards,|\nRegards,|\nSincerely,|\nCordialement,|\nMerci,)/i;

  const m = s.match(sigRegex);
  if (!m || typeof m.index !== "number") return { preview: s, hasSig: false };

  const idx = m.index;
  if (idx < 40) return { preview: s, hasSig: false };

  return { preview: s.slice(0, idx).trim(), hasSig: true };
}

function TimelineItem({ item }) {
  const isMessage = item.type === "message";
  const isInbound = item.direction === "inbound";

  let title = item.label;
  let pill = null;
  let body = null;

  const [expanded, setExpanded] = useState(false);

  if (isMessage) {
    title = isInbound ? "Inbound message" : "Outbound message";

    const channelClass = classifyChannel(item.channel);

    pill = (
      <span className="uppercase tracking-wide text-[0.65rem] px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300">
        {channelClass}
      </span>
    );

    const normalized = normalizeMessageBody(item.body || "");

    const EMAIL_LIMIT = 900;
    const OTHER_LIMIT = 1400;
    const limit = channelClass === "email" ? EMAIL_LIMIT : OTHER_LIMIT;

    const sigSplit =
      channelClass === "email" ? splitSignaturePreview(normalized) : { preview: normalized, hasSig: false };
    const basePreview = sigSplit.preview;

    const tooLong =
      (channelClass === "email" && sigSplit.hasSig) || normalized.length > limit || basePreview.length > limit;

    const shownBody = expanded ? normalized : truncateText(basePreview, limit);

    body = (
      <div className="space-y-2">
        <p className="text-sm text-slate-100 whitespace-pre-line">{shownBody}</p>

        {tooLong ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-medium text-sky-200 hover:text-sky-100"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    );
  } else {
    body = (
      <p className="text-xs text-slate-300">
        <span className="font-mono text-slate-400/90">{item.description || item.eventType}</span>
      </p>
    );
  }

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="absolute left-1 top-0 bottom-0 w-px bg-slate-700/70" />
      <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />

      <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200">{title}</span>
            {pill}
          </div>
          <span>{formatDate(item.at)}</span>
        </div>

        {body}
      </div>
    </div>
  );
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">{title}</p>
              <p className="mt-1 text-xs text-slate-400">Send an outbound message and log it to the timeline.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-slate-700"
            >
              Close
            </button>
          </div>

          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timelineFilter, setTimelineFilter] = useState("all");

  // --- Send modal state ---
  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState("sms"); // sms | email
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendHtml, setSendHtml] = useState(""); // optional
  const [sendMeta, setSendMeta] = useState({ source: "manual_ui", context: "lead_detail" });

  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  async function loadLead() {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${id}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load lead detail");

      const rawLead = json.lead || null;
      const inboxLead = json.inbox_lead || null;

      const rawMessages = json.messages || [];
      const rawEvents = json.events || [];
      const rawFollowups = json.followups || [];

      const lastContactAt =
        inboxLead?.last_contact_at ||
        rawLead?.last_message_at ||
        rawLead?.last_missed_call_at ||
        rawLead?.first_seen_at ||
        rawLead?.created_at ||
        null;

      const lead = rawLead
        ? {
            ...rawLead,
            firstSeenAt: rawLead.first_seen_at || rawLead.created_at,
            lastContactAt,
            createdAt: rawLead.created_at,
          }
        : null;

      const messageItems = rawMessages.map((m) => {
        const direction = m.direction || "outbound";
        const channelRaw = m.channel || m.message_type || "sms";
        const channel = classifyChannel(channelRaw);
        const body = m.body_text || m.body || "";

        return {
          id: `msg-${m.id}`,
          type: "message",
          direction,
          channel,
          body,
          at: m.created_at,
        };
      });

      const eventItems = rawEvents.map((e) => {
        const type = e.event_type || e.type || "";
        const { label, description } = getEventLabelAndDescription({ type });
        return {
          id: `evt-${e.id}`,
          type: "event",
          label,
          eventType: type,
          description,
          at: e.created_at,
        };
      });

      const timeline = [...messageItems, ...eventItems].sort((a, b) => {
        const da = a.at ? new Date(a.at).getTime() : 0;
        const db = b.at ? new Date(b.at).getTime() : 0;
        return db - da;
      });

      const inboundMessages = messageItems.filter((m) => m.direction === "inbound").length;
      const outboundMessages = messageItems.filter((m) => m.direction === "outbound").length;

      const stats = {
        totalMessages: messageItems.length,
        inboundMessages,
        outboundMessages,
      };

      const tasks = rawFollowups.map((f) => ({
        id: f.id,
        status: f.status || "open",
        followupType: f.followup_type || "Follow-up",
        sequenceStage: f.sequence_stage,
        dueAt: f.due_at,
        source: "automation",
      }));

      setData({ lead, inboxLead, timeline, stats, tasks });
    } catch (err) {
      console.error("Lead detail fetch error", err);
      setError(err.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const lead = data?.lead;
  const timeline = data?.timeline || [];
  const stats = data?.stats || { totalMessages: 0, inboundMessages: 0, outboundMessages: 0 };
  const tasks = data?.tasks || [];

  const openTasks = tasks.filter((t) => (t.status || "open").toLowerCase() !== "completed");
  const completedTasks = tasks.filter((t) => (t.status || "open").toLowerCase() === "completed");

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return timeline;

    if (timelineFilter === "sms" || timelineFilter === "email") {
      return timeline.filter((it) => it.type === "message" && classifyChannel(it.channel) === timelineFilter);
    }

    if (timelineFilter === "calls") {
      return timeline.filter((it) => it.type === "event" && (it.eventType || "").toLowerCase().includes("call"));
    }

    if (timelineFilter === "missed_calls") {
      return timeline.filter((it) => {
        if (it.type !== "event") return false;
        const t = (it.eventType || "").toLowerCase();
        return t.includes("call") && (t.includes("miss") || t.includes("missed"));
      });
    }

    return timeline;
  }, [timeline, timelineFilter]);

  function openSendModal(channel) {
    const ch = channel || "sms";
    setSendChannel(ch);

    // default recipient
    const defaultTo = ch === "sms" ? lead?.phone || "" : lead?.email || "";
    setSendTo(defaultTo);

    // default content
    setSendSubject(ch === "email" ? `Re: ${lead?.name || "Your request"}` : "");
    setSendBody("");
    setSendHtml("");
    setSendMeta({ source: "manual_ui", context: "lead_detail", lead_id: Number(id) });

    setSendError(null);
    setSendSuccess(null);
    setSendOpen(true);
  }

  async function submitSend() {
    if (!lead?.id) return;

    setSendLoading(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const payload = {
        lead_id: Number(lead.id),
        channel: sendChannel,
        to: (sendTo || "").trim(),
        subject: sendChannel === "email" ? (sendSubject || "").trim() : undefined,
        body: (sendBody || "").trim(),
        html: sendChannel === "email" && sendHtml.trim() ? sendHtml : undefined,
        meta: sendMeta && typeof sendMeta === "object" ? sendMeta : undefined,
      };

      if (!payload.to) throw new Error("Recipient is required");
      if (!payload.body) throw new Error("Message body is required");
      if (sendChannel === "email" && !payload.subject) throw new Error("Subject is required for email");

      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || `Send failed (${res.status})`);

      if (!json.success) {
        throw new Error(json.error || "Send failed");
      }

      setSendSuccess({
        provider: json.provider,
        provider_message_id: json.provider_message_id,
        message_id: json.message_id,
        created_at: json.created_at,
      });

      // Refresh timeline so outbound message shows up
      await loadLead();
    } catch (e) {
      setSendError(e?.message || "Failed to send");
    } finally {
      setSendLoading(false);
    }
  }

  return (
    <DashboardLayout title="Lead details">
      <div className="h-full w-full px-6 py-6 text-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push("/platform/leads")}
              className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <span className="mr-1.5 text-lg">←</span>
              Back to leads
            </button>

            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 border border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.5)]">
                <span className="text-sm font-semibold text-sky-300">
                  {lead?.name?.[0]?.toUpperCase() || lead?.phone?.slice(-2) || lead?.email?.[0]?.toUpperCase() || "L"}
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-slate-50 tracking-tight">
                  {lead?.name || lead?.phone || lead?.email || "Lead"}
                </h1>
                <p className="text-xs text-slate-400">
                  {lead?.source ? `Source: ${lead.source}` : "Captured by your automations"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {lead && <StatusBadge status={lead.status || "active"} />}
            <p className="text-xs text-slate-400">
              Last contact: <span className="text-slate-200">{formatDate(lead?.lastContactAt)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-100 tracking-wide">Conversation timeline</h2>
                <p className="text-xs text-slate-400">
                  All activity related to this lead (messages, calls, cold outreach events).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Filter</span>
                  <select
                    value={timelineFilter}
                    onChange={(e) => setTimelineFilter(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
                  >
                    <option value="all">All</option>
                    <option value="sms">SMS only</option>
                    <option value="email">Email only</option>
                    <option value="calls">Calls only</option>
                    <option value="missed_calls">Missed calls only</option>
                  </select>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    In: <span className="text-slate-100">{stats.inboundMessages}</span>
                  </span>
                  <span>
                    Out: <span className="text-slate-100">{stats.outboundMessages}</span>
                  </span>
                </div>
              </div>
            </div>

            {loading && <p className="text-sm text-slate-400">Loading timeline…</p>}
            {error && !loading && <p className="text-sm text-rose-300">{error}</p>}

            {!loading && !error && filteredTimeline.length === 0 && (
              <p className="text-sm text-slate-400">No items match this filter yet.</p>
            )}

            {!loading && !error && filteredTimeline.length > 0 && (
              <div className="mt-2">
                {filteredTimeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
              <h2 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Quick actions</h2>
              <p className="text-xs text-slate-400 mb-4">
                Manual sending is now enabled. Later these will also trigger n8n sequences (AI drafts, follow-ups, etc.).
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openSendModal("sms")}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium shadow-[0_0_18px_rgba(56,189,248,0.55)] transition",
                    lead?.phone
                      ? "bg-sky-500/90 hover:bg-sky-400 text-slate-950"
                      : "bg-slate-800 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!lead?.phone}
                  title={!lead?.phone ? "Lead has no phone number" : "Send SMS"}
                >
                  Send SMS reply
                </button>

                <button
                  type="button"
                  onClick={() => openSendModal("email")}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition",
                    lead?.email
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600/70"
                      : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                  )}
                  disabled={!lead?.email}
                  title={!lead?.email ? "Lead has no email" : "Send email"}
                >
                  Send email
                </button>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition cursor-not-allowed"
                  disabled
                >
                  Create follow-up task (next)
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-[11px] text-slate-500">
                  Tip: after sending, the message is written to the <span className="text-slate-300">messages</span>{" "}
                  table and will appear in the timeline automatically.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
              <h2 className="text-sm font-semibold text-slate-100 mb-3 tracking-wide">Lead details</h2>
              <dl className="grid grid-cols-1 gap-y-2 text-sm text-slate-200">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide">Phone</dt>
                  <dd className="font-medium">{lead?.phone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide">Email</dt>
                  <dd className="font-medium">{lead?.email || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide">First seen</dt>
                  <dd>{formatDate(lead?.firstSeenAt || lead?.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide">Last contact</dt>
                  <dd>{formatDate(lead?.lastContactAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide">Source</dt>
                  <dd className="capitalize">{lead?.source || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400 text-xs uppercase tracking-wide">Missed calls</dt>
                  <dd className="font-medium">{lead?.missed_call_count ?? 0}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-100 tracking-wide">Follow-up tasks</h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>
                    Open: <span className="text-sky-300">{openTasks.length}</span>
                  </span>
                  <span>
                    Completed: <span className="text-emerald-300">{completedTasks.length}</span>
                  </span>
                </div>
              </div>

              {loading && <p className="text-xs text-slate-400">Loading tasks…</p>}

              {!loading && tasks.length === 0 && (
                <p className="text-xs text-slate-400">
                  No follow-up tasks yet for this lead. When your AI creates follow-ups, they’ll appear here.
                </p>
              )}

              {!loading && tasks.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {tasks.map((task) => {
                    const statusLabel = (task.status || "open").toLowerCase();
                    const isCompleted = statusLabel === "completed";
                    const dueText = task.dueAt ? formatDate(task.dueAt) : "No due date";
                    const stageLabel =
                      typeof task.sequenceStage === "number" ? `Step ${task.sequenceStage}` : "—";

                    const badge = isCompleted ? (
                      <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-200">
                        Open
                      </span>
                    );

                    return (
                      <li
                        key={task.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-slate-100">{task.followupType || "Follow-up"}</span>
                          <span className="text-slate-400">
                            {stageLabel} · {dueText}
                          </span>
                          <span className="text-slate-500">Source: {task.source || "unknown"}</span>
                        </div>
                        <div className="mt-0.5">{badge}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Send Modal */}
        <Modal
          open={sendOpen}
          title={`Send ${sendChannel === "sms" ? "SMS" : "Email"} to ${lead?.name || "lead"}`}
          onClose={() => {
            if (sendLoading) return;
            setSendOpen(false);
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSendChannel("sms")}
              className={cx(
                "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                sendChannel === "sms"
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
              )}
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => setSendChannel("email")}
              className={cx(
                "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                sendChannel === "email"
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-sky-500/40"
              )}
            >
              Email
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">To</label>
              <input
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder={sendChannel === "sms" ? "+1..." : "name@email.com"}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Default is the lead’s phone/email. You can override if needed.
              </p>
            </div>

            {sendChannel === "email" ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Subject..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Message {sendChannel === "sms" ? "(text)" : "(text body)"}
              </label>
              <textarea
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                rows={sendChannel === "sms" ? 5 : 7}
                placeholder={sendChannel === "sms" ? "Write your SMS..." : "Write your email..."}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
              />
              {sendChannel === "sms" ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Keep it concise. (Server hard cap enforced.)
                </p>
              ) : null}
            </div>

            {sendChannel === "email" ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Optional HTML</label>
                <textarea
                  value={sendHtml}
                  onChange={(e) => setSendHtml(e.target.value)}
                  rows={4}
                  placeholder="<p>Optional HTML version...</p>"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  If provided, Mailgun will send both HTML + Text.
                </p>
              </div>
            ) : null}

            {sendError ? <p className="text-xs text-rose-300">{sendError}</p> : null}

            {sendSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold text-emerald-200">Sent successfully</p>
                <p className="mt-1 text-[11px] text-emerald-100">
                  Provider: {sendSuccess.provider} · Message ID: {sendSuccess.message_id}
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSendOpen(false)}
                disabled={sendLoading}
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-[11px] font-semibold text-slate-200 hover:border-slate-700 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSend}
                disabled={sendLoading}
                className="rounded-xl bg-sky-500 px-4 py-2 text-[11px] font-semibold text-white shadow shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60"
              >
                {sendLoading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
