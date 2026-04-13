// pages/platform/overview.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import StatCard from "../../src/components/dashboard/StatCard";
import { useBranding } from "../../src/components/dashboard/BrandingContext";
import { getBrandingStyles } from "../../src/components/dashboard/brandingUtils";
import { getAvatarColor, getInitial, formatTimeAgo, getSourceLabel, formatCurrency as fmt } from "../../src/lib/dashboardUtils";
import { SkeletonOverview } from "../../src/components/ui/Skeleton";
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
  Clock,
  CheckSquare,
} from "lucide-react";

function getGreeting(name) {
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  if (name) return `${base}, ${name.split("@")[0]}!`;
  return `${base}!`;
}

function getActivityDot(type) {
  if (type === "missed_call") return "bg-amber-400";
  if (type === "sms_sent_auto_reply") return "bg-violet-400";
  if (type === "lead_created") return "bg-blue-400";
  if (type === "message.call") return "bg-d-primary";
  if (type === "message.sms") return "bg-emerald-400";
  if (type === "message.email") return "bg-indigo-400";
  return "bg-d-muted";
}

const QUICK_PROMPTS = [
  { label: "Missed calls", q: "Show missed calls without follow-up", icon: PhoneMissed },
  { label: "No reply 24h", q: "Leads with no reply in 24 hours", icon: Clock },
  { label: "Tasks due", q: "Show open tasks due today", icon: CheckSquare },
  { label: "Hot leads", q: "Show hot leads to chase", icon: Flame },
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
      {loading ? <SkeletonOverview /> : <>
      {/* Greeting */}
      <div className="mb-6">
        <h1 suppressHydrationWarning className="text-xl font-semibold">
          {mounted ? getGreeting(userName) : "Welcome!"}
        </h1>
        <p className="mt-1 text-sm text-d-muted">{"Here's your business at a glance."}</p>
      </div>

      {/* Hero Banner: Revenue | Expenses | Net Profit */}
      <div className="mb-6">
        <div className="rounded-2xl border border-d-border bg-d-surface overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
            {/* Revenue */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/80">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {fmt(kpis.totalRevenue)}
                  </p>
                  <p className="text-[11px]">
                    {`MTD ${fmt(kpis.revenueMtd)} \u00b7 WTD ${fmt(kpis.revenueWtd)}`}
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
                    {fmt(kpis.totalExpenses)}
                  </p>
                  <p className="text-[11px]">
                    {`MTD ${fmt(kpis.expensesMtd)}`}
                  </p>
                </div>
              </div>
            </div>
            {/* Net Profit */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  (kpis.totalProfit || 0) >= 0
                    ? "bg-d-primary/20 shadow-[0_0_20px_rgb(var(--d-primary-rgb)/0.3)]"
                    : "bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    (kpis.totalProfit || 0) >= 0 ? "text-d-primary" : "text-rose-400"
                  }`} />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-d-primary/80">Net Profit</p>
                  <p className={`text-2xl font-bold ${
                    (kpis.totalProfit || 0) >= 0 ? "text-d-primary" : "text-rose-400"
                  }`}>
                    {fmt(kpis.totalProfit)}
                  </p>
                  <p className="text-[11px]">Revenue minus expenses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Leads & Jobs */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={UserPlus} accent="border-l-blue-400" label="New Leads" subLabel="This week" value={kpis.newLeadsThisWeek ?? "--"} />
        <StatCard icon={Zap} accent="border-l-d-primary" label="Active Jobs" subLabel="In progress" value={kpis.activeJobs ?? "--"} />
        <StatCard icon={Flame} accent="border-l-orange-400" label="Hot Leads" subLabel="Score 40+" value={kpis.hotLeadsCount ?? "--"} />
        <StatCard icon={Users} accent="border-l-blue-400" label="Total Leads" subLabel="All time captured" value={kpis.totalLeads ?? "--"} />
      </div>

      {/* Row 2: Money & AI */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={AlertCircle} accent="border-l-amber-400" label="Outstanding" subLabel="Balance owed by clients" value={fmt(kpis.outstandingBalance)} />
        <StatCard icon={Briefcase} accent="border-l-violet-400" label="Pipeline" subLabel="Active quotes & contracts" value={fmt(kpis.pipelineValue)} />
        <StatCard icon={PhoneMissed} accent="border-l-amber-400" label="Missed Calls" subLabel="This week" value={kpis.missedCallsThisWeek ?? "--"} />
        <StatCard icon={Bot} accent="border-l-d-primary" label="AI Answered" subLabel="Voice calls" value={kpis.voiceCallsThisWeek ?? "--"} />
      </div>

      {/* Ask Widget */}
      <div className="mb-6 rounded-2xl border border-d-border bg-d-surface px-4 py-4">
        <form onSubmit={handleAskSubmit} className="flex items-center gap-2">
          <label className="sr-only">Ask</label>
          <input
            type="text"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 rounded-xl border border-d-border bg-d-bg px-4 py-2.5 text-sm text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50"
          />
          <button
            type="submit"
            disabled={!askInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-d-primary text-white px-4 py-2.5 text-sm font-semibold shadow disabled:cursor-not-allowed disabled:opacity-40"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-d-border px-3 py-1.5 text-xs text-d-muted transition-colors hover:bg-d-primary/10 hover:text-d-text hover:border-d-primary/30"
              >
                {p.icon && <p.icon className="h-3 w-3" />}
                {p.label}
              </button>
            ))}
          </div>
          <Link href="/platform/ask" className="shrink-0 ml-3 text-xs font-medium text-d-primary hover:underline">
            Command Center &rarr;
          </Link>
        </div>
      </div>

      {/* Activity Feed + Recent Leads */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="rounded-2xl border border-d-border bg-d-surface p-4">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-xs text-d-muted">No recent activity.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {activity.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-d-border/20 transition-colors">
                  <div className="mt-1.5 flex flex-col items-center">
                    <span className={`block h-2.5 w-2.5 rounded-full ${getActivityDot(item.type)}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.leadId ? (
                      <Link href={`/platform/leads/${item.leadId}`} className="text-sm line-clamp-1 hover:text-d-primary transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <p className="text-sm line-clamp-1">{item.label}</p>
                    )}
                    <p suppressHydrationWarning className="text-[11px] text-d-muted">
                      {mounted ? formatTimeAgo(item.timestamp) : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {activity.length > 8 && (
            <p className="mt-2 text-xs">Showing 8 of {activity.length} events</p>
          )}
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl border border-d-border bg-d-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Leads</h2>
            <Link href="/platform/leads" className="text-xs">
              View all &rarr;
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-3 text-xs">No leads yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {recentLeads.slice(0, 6).map((lead) => (
                <li key={lead.id}>
                  <Link href={`/platform/leads/${lead.id}`} className="flex items-center gap-3 py-2.5 group">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(lead.name)}`}>
                      {getInitial(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {lead.name}
                      </p>
                      <p className="text-[11px]">
                        {lead.source ? getSourceLabel(lead.source) : ""}
                        {lead.status ? ` \u00b7 ${lead.status}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-d-muted" />
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
      </>}
    </DashboardLayout>
  );
}
