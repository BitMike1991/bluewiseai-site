// pages/platform/inbox/index.js — Split-pane messaging inbox
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";
import { useBranding } from "../../../src/components/dashboard/BrandingContext";
import { getStatusBadgeStyle } from "../../../src/components/dashboard/brandingUtils";
import { getAvatarColor, getInitial, formatTimeAgo } from "../../../src/lib/dashboardUtils";
import Select from "../../../src/components/ui/Select";
import { useToast } from "../../../src/components/ui/ToastContext";
import { SkeletonListRow, SkeletonPulse } from "../../../src/components/ui/Skeleton";
import EmptyState from "../../../src/components/ui/EmptyState";
import {
  Inbox, Search, ArrowLeft, Send, MessageSquare, Mail, Phone,
  ExternalLink, ChevronRight,
} from "lucide-react";

const STATUS_FILTERS = [
  { value: "open", label: "Open conversations" },
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "active", label: "Active / In convo" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const CHANNEL_FILTERS = [
  { value: "all", label: "All channels" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "call", label: "Calls" },
];

function formatDateTime(dateString) {
  if (!dateString) return "\u2014";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Montreal",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function formatDateGroup(dateString) {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function channelIcon(channel) {
  const c = (channel || "").toLowerCase();
  if (c === "sms" || c.includes("sms") || c.includes("telnyx")) return MessageSquare;
  if (c === "email" || c.includes("email") || c.includes("gmail")) return Mail;
  if (c === "call" || c.includes("call") || c.includes("voice")) return Phone;
  return MessageSquare;
}

// ── Conversation List (left pane) ──────────────────────────────

function ConversationList({
  conversations, loading, search, setSearch, onSearch,
  statusFilter, setStatusFilter, channelFilter, setChannelFilter,
  activeId, onSelect, onLoadInbox,
}) {
  const { branding } = useBranding();

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${branding.border_color || "#1e1e2e"}40` }}>
        <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-d-muted" />
          <input
            type="text"
            placeholder="Search name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-d-bg border border-d-border rounded-xl pl-9 pr-3 py-2 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50"
          />
        </form>
        <div className="flex gap-2">
          <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); onLoadInbox({ status: v }); }} options={STATUS_FILTERS} className="flex-1" />
          <Select value={channelFilter} onChange={(v) => { setChannelFilter(v); onLoadInbox({ channel: v }); }} options={CHANNEL_FILTERS} className="flex-1" />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-1">
            {Array.from({ length: 8 }, (_, i) => <SkeletonListRow key={i} />)}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState icon={Inbox} title="No conversations" description="Messages will appear when leads contact you" />
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li
                key={conv.id}
                onClick={() => onSelect(conv)}
                className="cursor-pointer transition-colors duration-150"
                style={{
                  backgroundColor: conv.id === activeId ? `${branding.primary_color || "#6c63ff"}10` : undefined,
                  borderLeft: conv.id === activeId ? `3px solid ${branding.primary_color || "#6c63ff"}` :
                    conv.needsFollowup ? "3px solid #f59e0b" : "3px solid transparent",
                }}
                onMouseEnter={(e) => { if (conv.id !== activeId) e.currentTarget.style.backgroundColor = `${branding.border_color || "#1e1e2e"}20`; }}
                onMouseLeave={(e) => { if (conv.id !== activeId) e.currentTarget.style.backgroundColor = ""; }}
              >
                <div className="px-3 py-2.5 flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(conv.name)}`}>
                    {getInitial(conv.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-d-text truncate">{conv.name || "Lead"}</p>
                      <span className="text-[10px] text-d-muted shrink-0">{formatTimeAgo(conv.lastContactAt)}</span>
                    </div>
                    <p className="text-xs text-d-muted line-clamp-1 mt-0.5">{conv.preview || "No messages"}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={getStatusBadgeStyle(conv.status, branding)}>
                        {conv.status || "new"}
                      </span>
                      {conv.missedCallCount > 0 && (
                        <span className="text-[9px] text-rose-400">{conv.missedCallCount} missed</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Thread View (right pane) ───────────────────────────────────

function ThreadView({ conv, onBack }) {
  const { branding } = useBranding();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState("sms");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  const loadThread = useCallback(async () => {
    if (!conv?.leadId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox/${conv.leadId}/messages`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setLead(data.lead || null);
      }
    } catch (e) {
      if (e.name !== "AbortError") console.error("[thread] load error", e);
    } finally {
      setLoading(false);
    }
  }, [conv?.leadId]);

  useEffect(() => { loadThread(); return () => abortRef.current?.abort(); }, [loadThread]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!loading && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!conv?.leadId) return;
    const interval = setInterval(loadThread, 30000);
    return () => clearInterval(interval);
  }, [conv?.leadId, loadThread]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || sending) return;

    // Optimistic update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      direction: "outbound",
      channel: replyChannel,
      body: text,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText("");
    setSending(true);

    try {
      const to = replyChannel === "sms" ? (lead?.phone || conv.phone) : (lead?.email || conv.email);
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: conv.leadId,
          channel: replyChannel,
          to,
          body: text,
          subject: replyChannel === "email" ? `Re: ${lead?.name || "Message"}` : undefined,
        }),
      });
      if (!res.ok) throw new Error("Send failed");
      toast.success(`${replyChannel === "sms" ? "SMS" : "Email"} sent`);
      // Reload to get server-confirmed message
      setTimeout(loadThread, 1000);
    } catch {
      // Revert optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error("Failed to send message");
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const grouped = [];
  let lastDate = "";
  for (const msg of messages) {
    const dateKey = new Date(msg.created_at).toDateString();
    if (dateKey !== lastDate) {
      grouped.push({ type: "date", date: msg.created_at, key: `date-${dateKey}` });
      lastDate = dateKey;
    }
    grouped.push({ type: "message", msg, key: msg.id });
  }

  const borderColor = branding.border_color || "#1e1e2e";
  const primaryColor = branding.primary_color || "#6c63ff";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg hover:bg-d-border/30 transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-d-muted" />
        </button>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(conv.name)}`}>
          {getInitial(conv.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-d-text truncate">{conv.name || "Lead"}</p>
          <p className="text-[11px] text-d-muted truncate">
            {conv.phone}{conv.phone && conv.email ? " · " : ""}{conv.email}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={getStatusBadgeStyle(conv.status, branding)}>
          {conv.status || "new"}
        </span>
        <Link href={`/platform/leads/${conv.leadId}`} className="shrink-0 p-1.5 rounded-lg hover:bg-d-border/30 transition-colors" title="View lead detail">
          <ExternalLink className="h-4 w-4 text-d-muted" />
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundColor: branding.dashboard_bg || "#0a0a12" }}>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
                <SkeletonPulse className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-d-muted">No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((item) => {
              if (item.type === "date") {
                return (
                  <div key={item.key} className="flex justify-center py-2">
                    <span className="text-[10px] text-d-muted bg-d-surface px-3 py-1 rounded-full border border-d-border/40">
                      {formatDateGroup(item.date)}
                    </span>
                  </div>
                );
              }

              const m = item.msg;
              const isOutbound = (m.direction || "").toLowerCase() === "outbound";
              const ChannelIcon = channelIcon(m.channel);

              return (
                <div key={item.key} className={`flex ${isOutbound ? "justify-end" : ""}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isOutbound
                        ? "rounded-br-md"
                        : "rounded-bl-md"
                    } ${m._optimistic ? "opacity-60" : ""}`}
                    style={{
                      backgroundColor: isOutbound ? `${primaryColor}15` : (branding.surface_color || "#111119"),
                      border: `1px solid ${isOutbound ? `${primaryColor}30` : borderColor}`,
                    }}
                  >
                    {m.subject && (
                      <p className="text-xs font-medium text-d-text mb-1">{m.subject}</p>
                    )}
                    <p className="text-d-text whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {m.body || "(empty)"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <ChannelIcon className="h-3 w-3 text-d-muted" />
                      <span className="text-[10px] text-d-muted" title={formatDateTime(m.created_at)}>
                        {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      {m._optimistic && <span className="text-[10px] text-d-muted">Sending...</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Reply bar */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: branding.surface_color || "#111119" }}>
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1">
            <div className="flex gap-1 mb-2">
              {["sms", "email"].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setReplyChannel(ch)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: replyChannel === ch ? `${primaryColor}20` : "transparent",
                    color: replyChannel === ch ? primaryColor : (branding.text_secondary || "#8888aa"),
                    border: `1px solid ${replyChannel === ch ? `${primaryColor}40` : borderColor}`,
                  }}
                >
                  {ch === "sms" ? "SMS" : "Email"}
                </button>
              ))}
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder={`Type ${replyChannel === "sms" ? "SMS" : "email"}...`}
              rows={1}
              className="w-full bg-d-bg border border-d-border rounded-xl px-3 py-2.5 text-sm text-d-text placeholder:text-d-muted focus:outline-none focus:ring-2 focus:ring-d-primary/50 resize-none"
              style={{ maxHeight: "100px" }}
            />
          </div>
          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="flex items-center justify-center h-10 w-10 rounded-xl text-white transition-opacity disabled:opacity-30 shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [channelFilter, setChannelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [mobileThread, setMobileThread] = useState(false);

  const loadInbox = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("status", opts.status ?? statusFilter);
      query.set("channel", opts.channel ?? channelFilter);
      if (search.trim()) query.set("search", search.trim());
      const res = await fetch(`/api/inbox?${query.toString()}`);
      const json = await res.json();
      if (res.ok) setConversations(json.items || []);
    } catch (err) {
      console.error("[Inbox] load error", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, search]);

  useEffect(() => { loadInbox(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (conv) => {
    setActiveConv(conv);
    setMobileThread(true);
  };

  const handleBack = () => {
    setMobileThread(false);
  };

  return (
    <DashboardLayout title="Inbox">
      <div className="h-[calc(100vh-120px)] -mx-4 md:-mx-6 -my-4 md:-my-6 flex overflow-hidden">
        {/* Left pane: conversation list */}
        <div className={`w-full md:w-[380px] md:min-w-[320px] md:max-w-[420px] shrink-0 border-r border-d-border flex flex-col ${mobileThread ? "hidden md:flex" : "flex"}`}>
          <ConversationList
            conversations={conversations}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onSearch={() => loadInbox()}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            activeId={activeConv?.id}
            onSelect={handleSelect}
            onLoadInbox={loadInbox}
          />
        </div>

        {/* Right pane: thread or empty */}
        <div className={`flex-1 min-w-0 flex flex-col ${!mobileThread && !activeConv ? "" : ""} ${mobileThread ? "flex" : "hidden md:flex"}`}>
          {activeConv ? (
            <ThreadView conv={activeConv} onBack={handleBack} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-d-border/30">
                  <Inbox className="h-8 w-8 text-d-muted" />
                </div>
                <p className="text-sm text-d-muted">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
