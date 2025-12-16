// pages/platform/inbox/index.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";

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
  if (!dateString) return "—";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function statusBadgeClasses(status) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
  switch ((status || "").toLowerCase()) {
    case "won":
      return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/50`;
    case "lost":
    case "dead":
      return `${base} bg-rose-500/10 text-rose-300 border-rose-500/50`;
    case "quoted":
      return `${base} bg-amber-500/15 text-amber-300 border-amber-500/50`;
    case "active":
    case "in_convo":
      return `${base} bg-sky-500/15 text-sky-300 border-sky-500/50`;
    case "new":
      return `${base} bg-indigo-500/15 text-indigo-300 border-indigo-500/50`;
    default:
      return `${base} bg-slate-700/70 text-slate-100 border-slate-500/60`;
  }
}

function channelPill(channel) {
  const c = (channel || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-medium";
  if (c === "sms") return `${base} bg-sky-500/10 border-sky-500/40 text-sky-200`;
  if (c === "email") return `${base} bg-indigo-500/10 border-indigo-500/40 text-indigo-200`;
  if (c === "call") return `${base} bg-emerald-500/10 border-emerald-500/40 text-emerald-200`;
  return `${base} bg-slate-700/50 border-slate-600/60 text-slate-200`;
}

export default function InboxPage() {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [channelFilter, setChannelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadInbox(opts = {}) {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      const statusVal = opts.status ?? statusFilter;
      const searchVal = opts.search ?? search;
      const channelVal = opts.channel ?? channelFilter;

      query.set("status", statusVal || "open");
      query.set("channel", channelVal || "all");

      if (searchVal && searchVal.trim().length > 0) {
        query.set("search", searchVal.trim());
      }

      const res = await fetch(`/api/inbox?${query.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || `Failed to load inbox (${res.status})`);

      setConversations(json.items || []);
    } catch (err) {
      console.error("[Inbox] load error", err);
      setError(err.message || "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardClick = (conv) => {
    const targetLeadId = conv.leadId || conv.id;
    if (!targetLeadId) return;
    router.push(`/platform/leads/${targetLeadId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInbox({ search });
  };

  const openCount = conversations.length;
  const followupCount = conversations.filter((c) => c.needsFollowup).length;

  const needsFollowupItems = useMemo(
    () => conversations.filter((c) => c.needsFollowup),
    [conversations]
  );

  return (
    <DashboardLayout title="Inbox">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Inbox</h1>
          <p className="text-sm text-slate-400">
            One thread per lead. Latest activity comes from SMS, Email, and Calls. Click a row to open the full lead timeline.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-0.5">
          <div>
            {openCount} thread{openCount === 1 ? "" : "s"}
          </div>
          {followupCount > 0 && (
            <div className="text-amber-300">
              {followupCount} need follow-up
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/40 transition"
          >
            Search
          </button>
        </form>

        <div className="w-full md:w-56">
          <select
            value={channelFilter}
            onChange={(e) => {
              const val = e.target.value;
              setChannelFilter(val);
              loadInbox({ channel: val });
            }}
            className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/60"
          >
            {CHANNEL_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-60">
          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val);
              loadInbox({ status: val });
            }}
            className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/60"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional: quick follow-up callout */}
      {!loading && !error && needsFollowupItems.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-200 font-semibold">
            Follow-up queue
          </p>
          <p className="text-xs text-amber-200/80 mt-1">
            {needsFollowupItems.length} lead{needsFollowupItems.length === 1 ? "" : "s"} look stale (missed calls or no reply in 24h).
          </p>
        </div>
      ) : null}

      {/* Conversation list */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg shadow-slate-950/60 overflow-hidden">
        {loading && <div className="px-4 py-6 text-sm text-slate-400">Loading inbox…</div>}

        {!loading && error && (
          <div className="px-4 py-6 text-sm text-rose-400">
            Error loading inbox: {error}
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-400">
            No threads yet. Once your workflows capture calls, SMS, or emails, leads will appear here.
          </div>
        )}

        <ul className="divide-y divide-slate-800/80">
          {conversations.map((conv) => (
            <li
              key={conv.id}
              onClick={() => handleCardClick(conv)}
              className="cursor-pointer hover:bg-slate-900/80 transition-colors"
            >
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/40 shadow-[0_0_14px_rgba(56,189,248,0.35)]">
                  <span className="text-xs font-semibold text-sky-300">
                    {conv.name?.[0]?.toUpperCase() ||
                      conv.phone?.slice(-2) ||
                      conv.email?.[0]?.toUpperCase() ||
                      "L"}
                  </span>
                  {conv.needsFollowup && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]" />
                  )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-50 truncate">
                        {conv.name || conv.phone || conv.email || "Lead"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {conv.phone ? <span>{conv.phone}</span> : null}
                        {conv.phone && conv.email ? <span> · </span> : null}
                        {conv.email ? <span>{conv.email}</span> : null}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={statusBadgeClasses(conv.status)}>
                        {conv.status || "new"}
                      </span>
                      <span className="text-[0.7rem] text-slate-500">
                        {formatDateTime(conv.lastContactAt || conv.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300 line-clamp-1">
                        {conv.preview || "No preview yet. Open the lead to view full timeline."}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={channelPill(conv.previewChannel)}>
                          {(conv.previewLabel || conv.previewChannel || "activity").toString()}
                          {conv.previewDirection ? ` · ${conv.previewDirection}` : ""}
                        </span>
                        <span className="hidden md:inline-flex text-[0.7rem] text-slate-500 capitalize">
                          {conv.source || "unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {typeof conv.missedCallCount === "number" && conv.missedCallCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/60 px-2 py-0.5 text-[0.7rem] font-medium text-rose-300">
                          {conv.missedCallCount} missed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
