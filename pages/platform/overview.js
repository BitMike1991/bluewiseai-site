// pages/platform/overview.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import StatCard from "../../src/components/dashboard/StatCard";
import { useBranding } from "../../src/components/dashboard/BrandingContext";
import { getBrandingStyles } from "../../src/components/dashboard/brandingUtils";
import { supabase } from "../../lib/supabaseClient";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Briefcase,
  PhoneMissed,
  Bot,
  Users,
  Flame,
  UserPlus,
  ArrowRight,
  Send,
  AlertCircle,
  Zap,
} from "lucide-react";

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
  const base = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  if (name) return `${base}, ${name.split("@")[0]}!`;
  return `${base}!`;
}

function fmt(n) {
  if (n == null) return "$0";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

const AVATAR_COLORS = [
  "bg-d-primary/20 text-blue-300",
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

function getActivityDot(type) {
  if (type === "missed_call") return "bg-amber-400";
  if (type === "sms_sent_auto_reply") return "bg-violet-400";
  if (type === "lead_created") return "bg-blue-400";
  if (type === "message.call") return "bg-sky-400";
  if (type === "message.sms") return "bg-emerald-400";
  if (type === "message.email") return "bg-indigo-400";
  return "bg-slate-500";
}

function getSourceLabel(source) {
  if (!source) return null;
  const map = { telnyx_sms: "SMS", telnyx_voice: "Voice", vapi: "Voice AI", web: "Web", manual: "Manual", referral: "Referral" };
  return map[source] || source;
}

const QUICK_PROMPTS = [
  { label: "Missed calls", q: "Show missed calls without follow-up" },
  { label: "No reply 24h", q: "Leads with no reply in 24 hours" },
  { label: "Tasks due", q: "Show open tasks due today" },
  { label: "Hot leads", q: "Show hot leads to chase" },
];

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState(null);
  const [askInput, setAskInput] = useState("");
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);

  useEffect(() => {
    setMounted(true);
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) setUserName(session.user.email || null);
      } catch {}
    }
    loadUser();
  }, []);

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
    return () => { cancelled = true; };
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
      {/* Greeting */}
      <div className="mb-6">
        <h1 suppressHydrationWarning className="text-xl font-semibold" style={{ color: styles.text.primary }}>
          {mounted ? getGreeting(userName) : "Welcome!"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: styles.text.secondary }}>{"Here's your business at a glance."}</p>
      </div>

      {/* Hero Banner: Revenue | Expenses | Net Profit */}
      <div className="mb-6">
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: styles.colors.border + '60' }}>
            {/* Revenue */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/80">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {loading ? "\u2026" : fmt(kpis.totalRevenue)}
                  </p>
                  <p className="text-[11px]" style={{ color: styles.text.secondary }}>
                    {loading ? "" : `MTD ${fmt(kpis.revenueMtd)} \u00b7 WTD ${fmt(kpis.revenueWtd)}`}
                  </p>
                </div>
              </div>
            </div>
            {/* Expenses */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                  <TrendingDown className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-rose-400/80">Total Expenses</p>
                  <p className="text-2xl font-bold text-rose-400">
                    {loading ? "\u2026" : fmt(kpis.totalExpenses)}
                  </p>
                  <p className="text-[11px]" style={{ color: styles.text.secondary }}>
                    {loading ? "" : `MTD ${fmt(kpis.expensesMtd)}`}
                  </p>
                </div>
              </div>
            </div>
            {/* Net Profit */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  !loading && (kpis.totalProfit || 0) >= 0
                    ? "bg-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                    : "bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    !loading && (kpis.totalProfit || 0) >= 0 ? "text-d-primary" : "text-rose-400"
                  }`} />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-d-primary/80">Net Profit</p>
                  <p className={`text-2xl font-bold ${
                    !loading && (kpis.totalProfit || 0) >= 0 ? "text-d-primary" : "text-rose-400"
                  }`}>
                    {loading ? "\u2026" : fmt(kpis.totalProfit)}
                  </p>
                  <p className="text-[11px]" style={{ color: styles.text.secondary }}>Revenue minus expenses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Pipeline & Growth */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={AlertCircle} accent="border-l-amber-400" label="Outstanding" subLabel="Balance owed by clients" value={loading ? "\u2026" : fmt(kpis.outstandingBalance)} />
        <StatCard icon={Briefcase} accent="border-l-violet-400" label="Pipeline" subLabel="Active quotes & contracts" value={loading ? "\u2026" : fmt(kpis.pipelineValue)} />
        <StatCard icon={Zap} accent="border-l-sky-400" label="Active Jobs" subLabel="In progress" value={loading ? "\u2026" : kpis.activeJobs ?? "--"} />
        <StatCard icon={Users} accent="border-l-blue-400" label="Total Leads" subLabel="All time captured" value={loading ? "\u2026" : kpis.totalLeads ?? "--"} />
      </div>

      {/* Row 2: AI Performance */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={UserPlus} accent="border-l-blue-400" label="New Leads" subLabel="This week" value={loading ? "\u2026" : kpis.newLeadsThisWeek ?? "--"} />
        <StatCard icon={PhoneMissed} accent="border-l-amber-400" label="Missed Calls" subLabel="This week" value={loading ? "\u2026" : kpis.missedCallsThisWeek ?? "--"} />
        <StatCard icon={Bot} accent="border-l-sky-400" label="AI Answered" subLabel="Voice calls" value={loading ? "\u2026" : kpis.voiceCallsThisWeek ?? "--"} />
        <StatCard icon={Flame} accent="border-l-orange-400" label="Hot Leads" subLabel="Score 40+" value={loading ? "\u2026" : kpis.hotLeadsCount ?? "--"} />
      </div>

      {/* Ask Widget */}
      <div className="mb-6 rounded-2xl border px-4 py-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.colors.primary + '40', boxShadow: `0 0 28px ${styles.colors.primary}12` }}>
        <form onSubmit={handleAskSubmit} className="flex items-center gap-2">
          <label className="sr-only">Ask</label>
          <input
            type="text"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder="Ask anything\u2026"
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{ ...styles.input, boxShadow: undefined }}
          />
          <button
            type="submit"
            disabled={!askInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold shadow disabled:cursor-not-allowed disabled:opacity-40"
            style={{ ...styles.button, boxShadow: `0 4px 12px ${styles.colors.primary}40` }}
          >
            <Send className="h-4 w-4" />
            Ask
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleQuickPrompt(p.q)}
                className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
                style={{ borderColor: styles.colors.border, color: styles.text.secondary }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link href="/platform/ask" className="shrink-0 ml-3 text-xs font-medium" style={{ color: styles.colors.primary }}>
            Command Center &rarr;
          </Link>
        </div>
      </div>

      {/* Activity Feed + Recent Leads */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
          <h2 className="text-sm font-semibold" style={{ color: styles.text.primary }}>Recent Activity</h2>
          {loading ? (
            <p className="mt-3 text-xs" style={{ color: styles.text.secondary }}>Loading&hellip;</p>
          ) : activity.length === 0 ? (
            <p className="mt-3 text-xs" style={{ color: styles.text.secondary }}>No recent activity.</p>
          ) : (
            <ul className="mt-3 space-y-0">
              {activity.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-2">
                  <div className="mt-1.5 flex flex-col items-center">
                    <span className={`block h-2.5 w-2.5 rounded-full ${getActivityDot(item.type)}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.leadId ? (
                      <Link href={`/platform/leads/${item.leadId}`} className="text-sm line-clamp-1" style={{ color: styles.text.primary }}>
                        {item.label}
                      </Link>
                    ) : (
                      <p className="text-sm line-clamp-1" style={{ color: styles.text.primary }}>{item.label}</p>
                    )}
                    <p suppressHydrationWarning className="text-[11px]" style={{ color: styles.text.secondary }}>
                      {mounted ? formatTimeAgo(item.timestamp) : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {activity.length > 8 && (
            <p className="mt-2 text-xs" style={{ color: styles.text.secondary }}>Showing 8 of {activity.length} events</p>
          )}
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: styles.text.primary }}>Recent Leads</h2>
            <Link href="/platform/leads" className="text-xs" style={{ color: styles.colors.primary }}>
              View all &rarr;
            </Link>
          </div>
          {loading ? (
            <p className="mt-3 text-xs" style={{ color: styles.text.secondary }}>Loading&hellip;</p>
          ) : recentLeads.length === 0 ? (
            <p className="mt-3 text-xs" style={{ color: styles.text.secondary }}>No leads yet.</p>
          ) : (
            <ul className="mt-3 divide-y" style={{ borderColor: styles.colors.border + '60' }}>
              {recentLeads.slice(0, 6).map((lead) => (
                <li key={lead.id}>
                  <Link href={`/platform/leads/${lead.id}`} className="flex items-center gap-3 py-2.5 group">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(lead.name)}`}>
                      {getInitial(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: styles.text.primary }}>
                        {lead.name}
                      </p>
                      <p className="text-[11px]" style={{ color: styles.text.secondary }}>
                        {lead.source ? getSourceLabel(lead.source) : ""}
                        {lead.status ? ` \u00b7 ${lead.status}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0" style={{ color: styles.colors.border }} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-400">Error loading overview: {error}</p>
      )}
    </DashboardLayout>
  );
}
