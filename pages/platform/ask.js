// pages/platform/ask.js — BlueWise Brain v2 Command Center
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader, Check, X, Edit2, Mic, Clock, Star, Sparkles, MessageSquare, Mail, ListTodo, Phone, ChevronRight, ExternalLink, ChevronDown } from "lucide-react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import ContextPanel from "../../src/components/brain/ContextPanel";

// -----------------------------
// Small UI utilities (kept from v1)
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
  if (k === "high") return "border-rose-500/40 bg-rose-500/10 text-rose-500";
  if (k === "medium") return "border-amber-500/40 bg-amber-500/10 text-amber-500";
  if (k === "low") return "border-d-border bg-d-surface/60 text-d-text";
  if (k === "positive") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-500";
  if (k === "negative") return "border-rose-500/40 bg-rose-500/10 text-rose-500";
  if (k === "mixed") return "border-violet-500/40 bg-violet-500/10 text-violet-500";
  if (k === "neutral") return "border-d-border bg-d-surface/60 text-d-text";
  return "border-d-border bg-d-surface/60 text-d-text";
}

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
// Storage helpers (saved prompts)
// -----------------------------
const LS_SAVED = "bluewise.ask.saved.v1";

function loadJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// -----------------------------
// Approval Card
// -----------------------------
function ApprovalCard({ toolInvocation }) {
  const [decided, setDecided] = useState(null);

  const { toolName, toolCallId, args } = toolInvocation;

  const friendlyName = {
    send_message: "Send Message",
    create_task: "Create Task",
    update_task: "Update Task",
    create_lead: "Create Lead",
    update_lead: "Update Lead",
    create_job: "Create Job",
    update_job: "Update Job",
    create_appointment: "Create Appointment",
    reschedule_appointment: "Reschedule",
  }[toolName] || toolName;

  // Format args for display
  function formatArgs(a) {
    if (!a) return "";
    const display = { ...a };
    // Mask sensitive fields
    if (display.to && display.to.includes("@")) {
      const [user, domain] = display.to.split("@");
      display.to = `${user.slice(0, 2)}***@${domain}`;
    }
    if (display.to && /^\+?\d/.test(display.to)) {
      display.to = display.to.slice(0, 4) + "***" + display.to.slice(-2);
    }
    return Object.entries(display)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => {
        const val = typeof v === "string" && v.length > 120
          ? v.slice(0, 120) + "\u2026"
          : v;
        return `${k}: ${typeof val === "string" ? val : JSON.stringify(val)}`;
      })
      .join("\n");
  }

  function handleApprove() {
    setDecided("approved");
  }

  function handleReject() {
    setDecided("rejected");
  }

  if (decided === "approved") {
    return (
      <div className="border-l-4 border-emerald-500 bg-emerald-500/5 rounded-r-xl px-4 py-3 text-sm text-emerald-600">
        <Check className="w-4 h-4 inline-block mr-2 -mt-0.5" />
        {friendlyName} approved
      </div>
    );
  }

  if (decided === "rejected") {
    return (
      <div className="border-l-4 border-rose-500 bg-rose-500/5 rounded-r-xl px-4 py-3 text-sm text-rose-500">
        <X className="w-4 h-4 inline-block mr-2 -mt-0.5" />
        {friendlyName} rejected
      </div>
    );
  }

  return (
    <div className="border-l-4 border-amber-500 bg-amber-500/5 rounded-r-xl px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-d-text">{friendlyName}</span>
        <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
          Needs approval
        </span>
      </div>

      <pre className="text-xs text-d-muted whitespace-pre-wrap bg-d-surface/60 rounded-lg px-3 py-2 border border-d-border overflow-x-auto">
        {formatArgs(args)}
      </pre>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          className="min-h-[44px] md:min-h-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <Check className="w-4 h-4 inline-block mr-1 -mt-0.5" />
          Approve
        </button>
        <button
          onClick={handleReject}
          className="min-h-[44px] md:min-h-0 rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <X className="w-4 h-4 inline-block mr-1 -mt-0.5" />
          Reject
        </button>
      </div>
    </div>
  );
}

// -----------------------------
// Interactive Lead Card (expandable + quick actions)
// -----------------------------
function LeadCard({ item, onAction, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const name = item.name || item.email || item.phone || "Lead";
  const statusColors = {
    new: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    contacted: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    qualified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    lost: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    closed: "bg-d-border/60 text-d-muted border-d-border",
    dead: "bg-d-border/60 text-d-muted border-d-border",
  };

  return (
    <div className={cx(
      "rounded-xl border transition-all duration-200",
      expanded ? "border-d-primary/40 bg-d-surface/80 shadow-sm" : "border-d-border bg-d-surface/60 hover:border-d-primary/30"
    )}>
      {/* Main row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left min-h-[56px]"
      >
        <div className={cx("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", avatarColor(name))}>
          {avatarInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-d-text truncate">{name}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className={cx("text-[10px] font-semibold px-1.5 py-0.5 rounded border", statusColors[item.status] || statusColors.new)}>
              {item.status || "new"}
            </span>
            {item.lastContactAt && (
              <span className="text-[10px] text-d-muted">{formatTimeAgo(item.lastContactAt)}</span>
            )}
            {item.source && (
              <span className="text-[10px] text-d-muted">{item.source}</span>
            )}
          </div>
        </div>
        {item.missedCallCount > 0 && (
          <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
            {item.missedCallCount} missed
          </span>
        )}
        <ChevronDown className={cx("w-4 h-4 text-d-muted shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      {/* Expanded details + actions */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-d-border/50 pt-3">
          {/* Contact details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.phone && (
              <div className="flex items-center gap-2 text-sm text-d-muted">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.phone}</span>
              </div>
            )}
            {item.email && (
              <div className="flex items-center gap-2 text-sm text-d-muted">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.email}</span>
              </div>
            )}
            {item.createdAt && (
              <div className="flex items-center gap-2 text-sm text-d-muted">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Added {formatTimeAgo(item.createdAt)}</span>
              </div>
            )}
            {item.language && (
              <div className="flex items-center gap-2 text-sm text-d-muted">
                <span className="w-3.5 h-3.5 shrink-0 text-center text-[10px] font-bold">{item.language.toUpperCase()}</span>
                <span>{item.language === "fr" ? "French" : item.language === "en" ? "English" : item.language}</span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.phone && (
              <button
                type="button"
                onClick={() => onAction?.("sms", item)}
                className="flex items-center gap-1.5 rounded-lg border border-d-border bg-d-bg px-3 py-1.5 text-xs font-semibold text-d-text hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[36px]"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                SMS
              </button>
            )}
            {item.email && (
              <button
                type="button"
                onClick={() => onAction?.("email", item)}
                className="flex items-center gap-1.5 rounded-lg border border-d-border bg-d-bg px-3 py-1.5 text-xs font-semibold text-d-text hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[36px]"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
            )}
            <button
              type="button"
              onClick={() => onAction?.("task", item)}
              className="flex items-center gap-1.5 rounded-lg border border-d-border bg-d-bg px-3 py-1.5 text-xs font-semibold text-d-text hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[36px]"
            >
              <ListTodo className="w-3.5 h-3.5" />
              Task
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.(item.leadId)}
              className="flex items-center gap-1.5 rounded-lg border border-d-primary/40 bg-d-primary/5 px-3 py-1.5 text-xs font-semibold text-d-primary hover:bg-d-primary/10 transition-colors min-h-[36px] ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------
// Tool Result Card
// -----------------------------
function ToolResultCard({ toolName, result, onLeadAction, onLeadNavigate }) {
  if (!result) return null;

  // Handle approval results
  if (result._approved) {
    return (
      <div className="text-sm text-emerald-600">
        <Check className="w-4 h-4 inline-block mr-1 -mt-0.5" />
        Action approved and executed.
      </div>
    );
  }
  if (result._rejected) {
    return (
      <div className="text-sm text-rose-500">
        <X className="w-4 h-4 inline-block mr-1 -mt-0.5" />
        Action rejected.
      </div>
    );
  }

  // Lead list — interactive cards
  if (toolName === "list_leads" || toolName === "find_lead") {
    const items = result.items || [];
    if (items.length === 0) {
      return <p className="text-sm text-d-muted">No leads found.</p>;
    }
    return (
      <div className="space-y-2">
        <p className="text-xs text-d-muted font-semibold uppercase tracking-wide">
          {items.length} lead{items.length !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {items.slice(0, 20).map((item, i) => (
            <LeadCard
              key={item.leadId || i}
              item={item}
              onAction={onLeadAction}
              onNavigate={onLeadNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  // Conversation summary
  if (toolName === "summarize_conversation") {
    const item = result.items?.[0];
    if (!item) return <p className="text-sm text-d-muted">No summary available.</p>;
    return (
      <div className="space-y-3 rounded-xl border border-d-border bg-d-surface/60 p-4">
        <div className="flex items-center gap-2">
          <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", badgeTone(item.sentiment))}>
            {item.sentiment || "neutral"}
          </span>
          <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", badgeTone(item.urgency))}>
            {item.urgency || "low"} urgency
          </span>
          <span className="text-xs text-d-muted">{item.messageCount || 0} messages</span>
        </div>
        <p className="text-sm text-d-text leading-relaxed">{item.summary}</p>
        {item.keyDetails?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-d-muted uppercase tracking-wide mb-1">Key Details</p>
            <ul className="space-y-1">
              {item.keyDetails.map((d, i) => (
                <li key={i} className="text-sm text-d-muted flex gap-2">
                  <span className="shrink-0">{"\u2022"}</span>
                  <span>{safeText(d)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {item.nextSteps?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-d-muted uppercase tracking-wide mb-1">Next Steps</p>
            <ul className="space-y-1">
              {item.nextSteps.map((s, i) => (
                <li key={i} className="text-sm text-d-text flex gap-2">
                  <span className="shrink-0">{"\u2192"}</span>
                  <span>{safeText(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Draft reply — with Send / Edit buttons per variant
  if (toolName === "draft_reply") {
    const item = result.items?.[0];
    if (!item) return null;
    const variants = Array.isArray(item.variants) ? item.variants : [];
    const channel = (item.channel || "sms").toLowerCase();
    const to = item.suggestedSendTo || "";

    return (
      <div className="space-y-3 rounded-xl border border-d-border bg-d-surface/60 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold bg-d-primary/10 text-d-primary px-2.5 py-1 rounded-full border border-d-primary/30">
            {channel.toUpperCase()}
          </span>
          <span className="text-xs text-d-muted">
            To: {to || "unknown"}
          </span>
        </div>
        {variants.map((v) => (
          <div key={v.id} className="rounded-lg border border-d-border bg-d-bg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-d-muted">Variant {v.id}</p>
            </div>
            {v.subject && (
              <p className="text-sm font-semibold text-d-text">Subject: {v.subject}</p>
            )}
            <p className="text-sm text-d-text whitespace-pre-wrap">{v.body}</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onLeadAction?.("send_variant", {
                  channel,
                  to,
                  body: v.body,
                  subject: v.subject || null,
                  variantId: v.id,
                })}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors min-h-[36px]"
              >
                <Send className="w-3.5 h-3.5" />
                Send this
              </button>
              <button
                type="button"
                onClick={() => onLeadAction?.("edit_variant", {
                  channel,
                  to,
                  body: v.body,
                  subject: v.subject || null,
                  variantId: v.id,
                })}
                className="flex items-center gap-1.5 rounded-lg border border-d-border px-3 py-2 text-xs font-semibold text-d-muted hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[36px]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Task list / created / updated
  if (toolName === "get_tasks" || toolName === "create_task" || toolName === "update_task") {
    const items = result.items || [];
    if (items.length === 0) return <p className="text-sm text-d-muted">No tasks found.</p>;
    return (
      <div className="space-y-2">
        {result.aiSummary && (
          <p className="text-sm text-d-muted">{result.aiSummary}</p>
        )}
        {items.map((t, i) => (
          <div key={t.id || i} className="flex items-center gap-3 rounded-xl border border-d-border bg-d-surface/60 p-3">
            <div className={cx(
              "w-2.5 h-2.5 rounded-full shrink-0",
              t.status === "completed" ? "bg-emerald-500" :
              t.status === "cancelled" ? "bg-rose-500" : "bg-amber-500"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-d-text truncate">{t.title || t.taskType || "Task"}</p>
              <p className="text-xs text-d-muted">
                {t.status}
                {t.dueAt ? ` ${"\u00b7"} due ${formatWhen(t.dueAt)}` : ""}
                {t.leadId ? ` ${"\u00b7"} lead #${t.leadId}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Send result
  if (toolName === "send_message") {
    const item = result.items?.[0];
    if (!item) return null;
    const ok = item.status === "sent";
    return (
      <div className={cx("rounded-xl border p-3", ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5")}>
        <p className={cx("text-sm font-semibold", ok ? "text-emerald-600" : "text-rose-500")}>
          {ok ? <Check className="w-4 h-4 inline-block mr-1 -mt-0.5" /> : <X className="w-4 h-4 inline-block mr-1 -mt-0.5" />}
          {result.aiSummary || (ok ? "Message sent" : "Failed to send")}
        </p>
      </div>
    );
  }

  // Default: formatted JSON fallback
  return (
    <div className="rounded-xl border border-d-border bg-d-surface/60 p-3">
      {result.aiSummary && <p className="text-sm text-d-muted mb-2">{result.aiSummary}</p>}
      <pre className="text-xs text-d-muted whitespace-pre-wrap overflow-x-auto max-h-60">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

// -----------------------------
// Saved Prompts Dropdown
// -----------------------------
function SavedDropdown({ saved, onApply, onRemove, onSave, hasInput }) {
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
          "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors min-h-[44px] md:min-h-0",
          open
            ? "border-d-primary/60 bg-d-primary/10 text-d-primary"
            : "border-d-border bg-d-surface text-d-muted hover:border-d-primary/40 hover:text-d-primary"
        )}
        title="Saved prompts"
      >
        <Star className="w-4 h-4 inline-block mr-1 -mt-0.5" />
        Saved
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-d-border bg-d-bg shadow-xl z-30">
          <div className="p-3 border-b border-d-border flex items-center justify-between">
            <span className="text-xs font-semibold text-d-muted">Saved prompts</span>
            {hasInput && (
              <button
                onClick={() => { onSave(); setOpen(false); }}
                className="text-xs font-semibold text-d-primary hover:text-d-primary"
              >
                + Save current
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {saved.length === 0 ? (
              <p className="text-xs text-d-muted text-center py-3">No saved prompts yet.</p>
            ) : (
              saved.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-d-surface/60 group cursor-pointer"
                  onClick={() => { onApply(s.q); setOpen(false); }}
                >
                  <span className="flex-1 text-sm text-d-text truncate">{s.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
                    className="opacity-0 group-hover:opacity-100 text-d-muted hover:text-rose-500 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
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
// Main Page Component
// -----------------------------
export default function AskPage() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const userScrolledUp = useRef(false);

  const [saved, setSaved] = useState([]);
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [activeLeadName, setActiveLeadName] = useState(null);
  const [contextLead, setContextLead] = useState(null);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [brief, setBrief] = useState(null);
  const [briefDismissed, setBriefDismissed] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);

  // Load saved prompts
  useEffect(() => {
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
    saveJson(LS_SAVED, saved);
  }, [saved]);

  // Fetch morning brief (once per day)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dismissKey = `bluewise.brief.dismissed.${today}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(dismissKey)) {
      setBriefDismissed(true);
      return;
    }
    setBriefLoading(true);
    fetch("/api/brain/brief")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setBrief(data); })
      .catch(() => {})
      .finally(() => setBriefLoading(false));
  }, []);

  function dismissBrief() {
    setBriefDismissed(true);
    const today = new Date().toISOString().slice(0, 10);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`bluewise.brief.dismissed.${today}`, "1");
    }
  }

  // Chat state — managed manually (bypasses useChat hook bug)
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const abortRef = useRef(null);

  // Send message via fetch + SSE streaming
  async function sendMessage({ text }) {
    if (!text?.trim() || isLoading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      parts: [{ type: "text", text: text.trim() }],
    };

    // Build message history for the API (UIMessage format)
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setChatError(null);

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts || [{ type: "text", text: m.content || "" }],
          })),
          context: {
            activePage: "command-center",
            activeLeadId,
            activeLeadName,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed: ${res.status}`);
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "",
        parts: [],
        toolInvocations: [],
      };

      // Add empty assistant message immediately
      setMessages((prev) => [...prev, { ...assistantMsg }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            const type = event.type;

            if (type === "text-delta") {
              assistantMsg.content += event.delta || "";
              const lastPart = assistantMsg.parts[assistantMsg.parts.length - 1];
              if (lastPart?.type === "text") {
                lastPart.text = assistantMsg.content;
              } else {
                assistantMsg.parts.push({ type: "text", text: assistantMsg.content });
              }
            } else if (type === "tool-call") {
              assistantMsg.toolInvocations.push({
                toolCallId: event.toolCallId,
                toolName: event.toolName,
                args: event.args || {},
                state: "call",
              });
            } else if (type === "tool-result") {
              const idx = assistantMsg.toolInvocations.findIndex(
                (t) => t.toolCallId === event.toolCallId
              );
              if (idx >= 0) {
                assistantMsg.toolInvocations[idx].state = "result";
                assistantMsg.toolInvocations[idx].result = event.result;
              }
            } else if (type === "error") {
              console.error("[Brain] Stream error:", event.error);
              setChatError({ message: event.error || "AI error" });
            }

            // Update messages state with latest assistant message
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { ...assistantMsg, parts: [...assistantMsg.parts], toolInvocations: [...assistantMsg.toolInvocations] };
              return copy;
            });
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[Brain] Chat error:", err.message);
        setChatError(err);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  // Handle ?q= URL param (quick-ask from overview)
  useEffect(() => {
    const q = router.query.q;
    if (q && typeof q === "string" && q.trim()) {
      sendMessage({ text: q.trim() });
      router.replace("/platform/ask", undefined, { shallow: true });
    }
  }, [router.query.q]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (!scrollRef.current || userScrolledUp.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Track user scroll position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
  }, []);

  // Submit message
  function submitMessage(e) {
    if (e) e.preventDefault();
    const text = (input || "").trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  }

  // Handle Enter/Shift+Enter
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }

  function applyPrompt(q) {
    setInput(q);
    setTimeout(() => inputRef.current?.focus?.(), 50);
  }

  function saveCurrentPrompt() {
    const q = (input || "").trim();
    if (!q) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const label = q.length > 40 ? q.slice(0, 40) + "\u2026" : q;
    setSaved((prev) => [{ id, label, q }, ...prev].slice(0, 12));
  }

  function removeSaved(id) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  // Extract active lead from tool results + populate context panel
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant" || !msg.toolInvocations) continue;
      for (const inv of msg.toolInvocations) {
        if (inv.state === "result" && inv.result?.items?.[0]) {
          const item = inv.result.items[0];
          const leadId = item.leadId;
          const name = item.name || item.leadName;
          if (leadId) {
            setActiveLeadId(leadId);
            if (name) setActiveLeadName(name);
            setContextLead({
              leadId,
              name: name || null,
              email: item.email || null,
              phone: item.phone || null,
              status: item.status || null,
              source: item.source || null,
              lastContactAt: item.lastContactAt || null,
              missedCallCount: item.missedCallCount || 0,
              messageCount: item.messageCount || null,
              createdAt: item.createdAt || null,
            });
            return;
          }
        }
      }
    }
  }, [messages]);

  function handleContextAction(action, data) {
    if (action === "send_variant") {
      const { channel, to, body, subject } = data;
      const subjectPart = subject ? ` with subject "${subject}"` : "";
      sendMessage({
        text: `Send this ${channel} to ${to}${subjectPart}: "${body}"`,
      });
      return;
    }
    if (action === "edit_variant") {
      const { body } = data;
      setInput(`Edit this draft: "${body.length > 200 ? body.slice(0, 200) + "..." : body}"`);
      inputRef.current?.focus?.();
      return;
    }
    const prompts = {
      sms: `Draft an SMS reply for lead #${data.leadId}`,
      email: `Draft an email reply for lead #${data.leadId}`,
      task: `Create a follow-up task for lead #${data.leadId} tomorrow at 9:00`,
    };
    const text = prompts[action];
    if (text) sendMessage({ text });
  }

  // Example chips
  const examples = [
    { label: "Show my leads", q: "Show my leads" },
    { label: "No reply 24h", q: "Which leads haven't replied in 24h?" },
    { label: "Tasks due today", q: "Show tasks due today." },
    { label: "Draft a reply", q: "Draft a reply for my most recent lead" },
    { label: "Pipeline overview", q: "Show me my pipeline" },
    { label: "Missed calls", q: "Show missed calls without follow-up." },
  ];

  return (
    <DashboardLayout title="Command Center">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-4 md:px-6 pt-4 pb-3 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-d-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-d-primary" />
              Command Center
            </h1>
            <p className="text-sm text-d-muted mt-0.5">Your AI copilot for leads, tasks, and conversations</p>
          </div>
          <SavedDropdown
            saved={saved}
            onApply={applyPrompt}
            onRemove={removeSaved}
            onSave={saveCurrentPrompt}
            hasInput={!!input?.trim()}
          />
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 space-y-4"
        >
          {/* Morning brief */}
          {messages.length === 0 && !briefDismissed && (brief || briefLoading) && (
            <div className="rounded-2xl border border-d-border bg-d-surface/60 p-5 space-y-3">
              {briefLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-5 w-48 rounded-lg bg-d-border/60" />
                  <div className="h-4 w-full rounded-lg bg-d-border/40" />
                  <div className="h-4 w-3/4 rounded-lg bg-d-border/40" />
                </div>
              ) : brief ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-d-text">
                      <Sparkles className="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-d-primary" />
                      {brief.greeting || "Good morning"}{"."}
                    </p>
                    <button onClick={dismissBrief} className="text-d-muted hover:text-d-text">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {brief.bullets?.length > 0 && (
                    <ul className="space-y-1.5">
                      {brief.bullets.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-d-muted">
                          <span className="text-d-primary shrink-0">{"\u2192"}</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {brief.stats && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {brief.stats.openLeadCount > 0 && (
                        <span className="text-xs bg-d-primary/10 text-d-primary px-2 py-1 rounded-full border border-d-primary/20">
                          {brief.stats.openLeadCount} open leads
                        </span>
                      )}
                      {brief.stats.overdueTaskCount > 0 && (
                        <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full border border-rose-500/20">
                          {brief.stats.overdueTaskCount} overdue tasks
                        </span>
                      )}
                      {brief.stats.todayJobCount > 0 && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full border border-emerald-500/20">
                          {brief.stats.todayJobCount} jobs today
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-d-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-d-primary" />
              </div>
              <p className="text-lg font-semibold text-d-text">Ready to assist</p>
              <p className="text-sm text-d-muted mt-1 max-w-md">
                Ask a question about your leads, tasks, or conversations. Or pick a suggestion below.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      sendMessage({ text: ex.q });
                    }}
                    className="rounded-full border border-d-border bg-d-surface px-3 py-1.5 text-sm text-d-muted hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[44px] md:min-h-0"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id}>
              {/* User message */}
              {msg.role === "user" && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] md:max-w-lg rounded-2xl bg-d-primary px-4 py-3 text-sm text-white">
                    {typeof msg.content === "string"
                      ? msg.content
                      : msg.parts?.filter((p) => p.type === "text").map((p) => p.text).join("") || ""}
                  </div>
                </div>
              )}

              {/* Assistant message */}
              {msg.role === "assistant" && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] md:max-w-2xl space-y-3">
                    {/* Text content — try parts first, fall back to content string */}
                    {msg.parts
                      ? msg.parts.filter((p) => p.type === "text" && p.text?.trim()).map((part, pi) => (
                          <div
                            key={pi}
                            className="rounded-2xl border border-d-border bg-d-surface/60 px-4 py-3 text-sm text-d-text leading-relaxed whitespace-pre-wrap"
                          >
                            {part.text}
                          </div>
                        ))
                      : typeof msg.content === "string" && msg.content.trim() ? (
                          <div className="rounded-2xl border border-d-border bg-d-surface/60 px-4 py-3 text-sm text-d-text leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        ) : null
                    }

                    {/* Tool invocations */}
                    {msg.toolInvocations?.map((inv) => (
                      <div key={inv.toolCallId} className="space-y-2">
                        {/* Partial call / thinking */}
                        {(inv.state === "partial-call" || inv.state === "call") && (
                          <div className="flex items-center gap-2 text-sm text-d-muted">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Running {inv.toolName}...</span>
                          </div>
                        )}

                        {/* Approval requested (needsApproval tools) */}
                        {inv.state === "approval-requested" && (
                          <ApprovalCard toolInvocation={inv} />
                        )}

                        {/* Result */}
                        {inv.state === "result" && (
                          <ToolResultCard
                            toolName={inv.toolName}
                            result={inv.result}
                            onLeadAction={(action, lead) => handleContextAction(action, lead)}
                            onLeadNavigate={(leadId) => router.push(`/platform/leads/${leadId}`)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-d-border bg-d-surface/60 px-4 py-3">
                <Loader className="w-4 h-4 text-d-primary animate-spin" />
                <span className="text-sm text-d-muted">Thinking...</span>
                <span className="w-1.5 h-5 bg-d-primary/60 animate-pulse rounded-sm" />
              </div>
            </div>
          )}

          {/* Error */}
          {chatError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 px-4 py-3">
              <p className="text-sm text-rose-500">{chatError.message || "Something went wrong."}</p>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-d-border bg-d-bg px-4 md:px-6 py-3">
          <form
            id="brain-chat-form"
            onSubmit={submitMessage}
            className="max-w-3xl mx-auto flex items-end gap-3"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask BlueWise Brain..."
                rows={1}
                className="w-full resize-none rounded-xl border border-d-border bg-d-surface px-4 py-3 pr-10 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60 max-h-32"
                style={{ minHeight: "44px" }}
              />
              <div className="absolute right-3 bottom-3">
                <Mic className="w-4 h-4 text-d-muted/40" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="min-h-[44px] rounded-xl bg-d-primary px-4 py-3 text-white shadow shadow-d-primary/40 transition hover:bg-d-primary/80 disabled:cursor-not-allowed disabled:bg-d-border disabled:text-d-muted disabled:shadow-none"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          {activeLeadId && (
            <p className="text-xs text-d-muted text-center mt-2">
              Active lead: {activeLeadName || `#${activeLeadId}`}
            </p>
          )}
        </div>
        </div>

        {/* Context Panel (desktop only) */}
        <ContextPanel
          lead={contextLead}
          collapsed={contextCollapsed}
          onToggle={() => setContextCollapsed(!contextCollapsed)}
          onAction={handleContextAction}
        />
      </div>
    </DashboardLayout>
  );
}
