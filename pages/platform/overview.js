// pages/platform/overview.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import StatCard from "../../src/components/dashboard/StatCard";
import { supabase } from "../../lib/supabaseClient";
import {
  DollarSign,
  PhoneMissed,
  Bot,
  MessageSquare,
  UserPlus,
  Flame,
  CalendarCheck,
  ArrowRight,
  Send,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

function getGreeting(name) {
  const h = new Date().getHours();
  const base =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  if (name) return `${base}, ${name.split("@")[0]}!`;
  return `${base}!`;
}

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-violet-500/20 text-violet-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-pink-500/20 text-pink-300",
  "bg-indigo-500/20 text-indigo-300",
];

function getAvatarColor(name) {
  let hash = 0;
  const str = (name || "").toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name) {
  if (!name || name === "null" || name === "undefined") return "?";
  return name.charAt(0).toUpperCase();
}

// Activity dot color by event type
function getActivityDot(type) {
  if (type === "missed_call") return "bg-amber-400";
  if (type === "sms_sent_auto_reply") return "bg-violet-400";
  if (type === "lead_created") return "bg-blue-400";
  if (type === "message.call") return "bg-sky-400";
  if (type === "message.sms") return "bg-emerald-400";
  if (type === "message.email") return "bg-indigo-400";
  return "bg-slate-500";
}

// Source label mapping
function getSourceLabel(source) {
  if (!source) return null;
  const map = {
    telnyx_sms: "SMS",
    telnyx_voice: "Voice",
    vapi: "Voice AI",
    web: "Web",
    manual: "Manual",
    referral: "Referral",
  };
  return map[source] || source;
}

// ── Quick prompts for Ask widget ─────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "Missed calls", q: "Show missed calls without follow-up" },
  { label: "No reply 24h", q: "Leads with no reply in 24 hours" },
  { label: "Tasks due", q: "Show open tasks due today" },
  { label: "Hot leads", q: "Show hot leads to chase" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState(null);
  const [askInput, setAskInput] = useState("");

  // Load user name for greeting
  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUserName(session.user.email || null);
        }
      } catch {}
    }
    loadUser();
  }, []);

  // Fetch overview data
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
  const activity = data?.activity || [];
  const recentLeads = data?.recentLeads || [];

  function handleAskSubmit(e) {
    e.preventDefault();
    const q = askInput.trim();
    if (!q) return;
    router.push(`/platform/ask?q=${encodeURIComponent(q)}`);
  }

  function handleQuickPrompt(q) {
    router.push(`/platform/ask?q=${encodeURIComponent(q)}`);
  }

  return (
    <DashboardLayout title="Overview">
      {/* ── Greeting ── */}
      <div className="mb-6">
        <h1
          suppressHydrationWarning
          className="text-xl font-semibold text-slate-50"
        >
          {mounted ? getGreeting(userName) : "Welcome!"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {"Here's your week at a glance."}
        </p>
      </div>

      {/* ── Hero Card: Revenue Protected ── */}
      <div className="mb-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-slate-950/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-300/70">
                Revenue Protected
              </p>
              <p className="text-3xl font-bold text-emerald-400">
                {loading
                  ? "…"
                  : kpis.revenueProtected != null
                  ? `$${kpis.revenueProtected.toLocaleString()}`
                  : "$0"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {loading
                  ? ""
                  : `${kpis.voiceCallsThisWeek || 0} voice calls answered × $300 avg value`}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          {!loading && kpis.voiceCallsThisWeek > 0 && (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
              <div
                className="h-full rounded-full bg-emerald-500/60"
                style={{
                  width: `${Math.min(100, (kpis.voiceCallsThisWeek / 20) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── 6 KPI Cards ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={PhoneMissed}
          accent="border-l-amber-400"
          label="Missed Calls"
          subLabel="This week"
          value={loading ? "…" : kpis.missedCallsThisWeek ?? "--"}
        />
        <StatCard
          icon={Bot}
          accent="border-l-sky-400"
          label="Voice AI Answered"
          subLabel="This week"
          value={loading ? "…" : kpis.voiceCallsThisWeek ?? "--"}
        />
        <StatCard
          icon={MessageSquare}
          accent="border-l-violet-400"
          label="Auto-Replies"
          subLabel="This week"
          value={loading ? "…" : kpis.aiRepliesThisWeek ?? "--"}
        />
        <StatCard
          icon={UserPlus}
          accent="border-l-blue-400"
          label="New Leads"
          subLabel="This week"
          value={loading ? "…" : kpis.newLeadsThisWeek ?? "--"}
        />
        <StatCard
          icon={Flame}
          accent="border-l-orange-400"
          label="Hot Leads"
          subLabel="High-priority"
          value={loading ? "…" : kpis.hotLeadsCount ?? "--"}
        />
        <StatCard
          icon={CalendarCheck}
          accent="border-l-rose-400"
          label="Tasks Due Today"
          subLabel="Open tasks"
          value={loading ? "…" : kpis.tasksDueToday ?? "--"}
        />
      </div>

      {/* ── Activity Feed + Recent Leads (side by side) ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50">
            Recent Activity
          </h2>

          {loading ? (
            <p className="mt-3 text-xs text-slate-500">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No recent activity.</p>
          ) : (
            <ul className="mt-3 space-y-0">
              {activity.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-2">
                  {/* Timeline dot */}
                  <div className="mt-1.5 flex flex-col items-center">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${getActivityDot(item.type)}`}
                    />
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {item.leadId ? (
                      <Link
                        href={`/platform/leads/${item.leadId}`}
                        className="text-sm text-slate-200 hover:text-sky-300 line-clamp-1"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <p className="text-sm text-slate-200 line-clamp-1">
                        {item.label}
                      </p>
                    )}
                    <p
                      suppressHydrationWarning
                      className="text-[11px] text-slate-500"
                    >
                      {mounted ? formatTimeAgo(item.timestamp) : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activity.length > 8 && (
            <p className="mt-2 text-xs text-slate-500">
              Showing 8 of {activity.length} events
            </p>
          )}
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">
              Recent Leads
            </h2>
            <Link
              href="/platform/leads"
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="mt-3 text-xs text-slate-500">Loading…</p>
          ) : recentLeads.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No leads yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-800/60">
              {recentLeads.slice(0, 6).map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/platform/leads/${lead.id}`}
                    className="flex items-center gap-3 py-2.5 group"
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(lead.name)}`}
                    >
                      {getInitial(lead.name)}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100 group-hover:text-sky-300">
                        {lead.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {lead.source ? getSourceLabel(lead.source) : ""}
                        {lead.status ? ` · ${lead.status}` : ""}
                      </p>
                    </div>
                    {/* Arrow */}
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-sky-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Ask BlueWise Widget ── */}
      <div className="rounded-2xl border border-sky-700/40 bg-slate-950/80 px-4 py-4 shadow-[0_0_28px_rgba(56,189,248,0.12)]">
        <form onSubmit={handleAskSubmit} className="flex items-center gap-2">
          <label className="sr-only">Ask BlueWise</label>
          <input
            type="text"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder="Ask BlueWise anything…"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500/60"
          />
          <button
            type="submit"
            disabled={!askInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow shadow-sky-500/40 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Send className="h-4 w-4" />
            Ask
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleQuickPrompt(p.q)}
              className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-500/60 hover:text-sky-200 hover:bg-sky-500/10"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-400">
          Error loading overview: {error}
        </p>
      )}
    </DashboardLayout>
  );
}
