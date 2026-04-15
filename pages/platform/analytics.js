// pages/platform/analytics.js
import { useEffect, useState } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import { useBranding } from "../../src/components/dashboard/BrandingContext";
import {
  BarChart2, TrendingUp, TrendingDown, Users, Phone, MessageSquare,
  DollarSign, Zap, Clock, ArrowUpRight, ArrowDownRight, Minus,
  Download, Calendar, Globe, Facebook, ExternalLink, Activity, Instagram, Eye,
} from "lucide-react";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function fmt(n) {
  if (n == null) return "$0";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n) {
  if (n == null) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function getPieColors(primary) {
  return [primary || "#6c63ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
}

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, suffix, previous, changePercent, color, branding }) {
  const primary = branding?.primary_color || "#6c63ff";
  const isUp = changePercent > 0;
  const isDown = changePercent < 0;
  const Arrow = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const changeColor = isUp ? "#10b981" : isDown ? "#ef4444" : "#888";

  // Speed-to-lead: lower is better
  const invertedLabel = label === "Speed to Lead";
  const effectiveChangeColor = invertedLabel ? (isDown ? "#10b981" : isUp ? "#ef4444" : "#888") : changeColor;

  return (
    <div className="rounded-2xl border border-d-border bg-d-surface p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color || primary}15` }}>
          <Icon className="w-4 h-4" style={{ color: color || primary }} />
        </div>
        <span className="text-xs text-d-muted font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-d-text">
        {value}{suffix && <span className="text-sm font-normal text-d-muted ml-1">{suffix}</span>}
      </div>
      {changePercent != null && (
        <div className="flex items-center gap-1 mt-0.5">
          <Arrow className="w-3.5 h-3.5" style={{ color: effectiveChangeColor }} />
          <span className="text-xs font-medium" style={{ color: effectiveChangeColor }}>
            {Math.abs(changePercent)}%
          </span>
          <span className="text-xs text-d-muted">vs prev period</span>
        </div>
      )}
    </div>
  );
}

// ── Speed-to-lead color ──
function speedColor(minutes) {
  if (minutes == null) return "#888";
  if (minutes < 5) return "#10b981";
  if (minutes <= 15) return "#f59e0b";
  return "#ef4444";
}

export default function AnalyticsPage() {
  const { branding } = useBranding();
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rc, setRc] = useState(null);

  const primary = branding?.primary_color || "#6c63ff";
  const accent = branding?.accent_color || "#00d4aa";
  const borderHex = branding?.border_color || "#1e1e2e";
  const mutedHex = branding?.text_secondary || "#8888aa";
  const colors = getPieColors(primary);

  useEffect(() => {
    import("recharts").then((mod) => setRc(mod)).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?range=${range}`)
      .then(async (r) => {
        const text = await r.text();
        let d;
        try { d = JSON.parse(text); } catch { throw new Error(`Parse error: ${text.slice(0, 200)}`); }
        if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(d)}`);
        return d;
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  const tickProps = { fill: mutedHex, fontSize: 11 };
  const axisProps = { axisLine: false, tickLine: false };
  const chartsReady = rc && data && !loading;

  // ── CSV Export ──
  function exportCSV() {
    if (!data) return;
    const sections = [];

    if (data.leadsPerDay?.length) {
      sections.push("Leads Over Time\nDate,Count");
      data.leadsPerDay.forEach(r => sections.push(`${r.date},${r.count}`));
    }
    if (data.leadsBySource?.length) {
      sections.push("\nLead Sources\nSource,Count");
      data.leadsBySource.forEach(r => sections.push(`"${r.source}",${r.count}`));
    }
    if (data.conversionFunnel?.length) {
      sections.push("\nConversion Funnel\nStage,Count,Value");
      data.conversionFunnel.forEach(r => sections.push(`"${r.stage}",${r.count},${r.value ?? ""}`));
    }
    if (data.revenuePerWeek?.length) {
      sections.push("\nRevenue\nPeriod,Revenue");
      data.revenuePerWeek.forEach(r => sections.push(`${r.week},${r.revenue}`));
    }
    if (data.messageVolume?.length) {
      sections.push("\nMessage Volume\nPeriod,SMS,Voice,Email");
      data.messageVolume.forEach(r => sections.push(`${r.week},${r.sms},${r.call},${r.email}`));
    }
    if (data.socialInsights?.impressions?.length) {
      sections.push("\nSocial Media - Impressions\nDate,Impressions,Unique Reach,Page Views,Engaged Users");
      data.socialInsights.impressions.forEach((d, i) => {
        const reach = data.socialInsights.uniqueReach?.[i]?.value || 0;
        const pv = data.socialInsights.pageViews?.[i]?.value || 0;
        const eng = data.socialInsights.engagedUsers?.[i]?.value || 0;
        sections.push(`${d.date},${d.value},${reach},${pv},${eng}`);
      });
    }
    if (data.pixelInsights?.events?.length) {
      sections.push("\nMeta Pixel Events\nEvent,Count");
      data.pixelInsights.events.forEach(e => sections.push(`"${e.name}",${e.count}`));
    }
    if (data.trafficInsights?.daily?.length) {
      sections.push("\nWebsite Traffic\nDate,Sessions,Users,Pageviews,Bounce Rate");
      data.trafficInsights.daily.forEach(d => sections.push(`${d.date},${d.sessions},${d.users},${d.pageviews},${d.bounceRate}`));
    }

    const blob = new Blob([sections.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-d-border bg-d-surface px-3 py-2 text-xs shadow-lg">
        <p className="text-d-text font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && (p.name === "Revenue" || p.name === "Spend ($)") ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }

  function Skeleton({ h = "h-64" }) {
    return (
      <div className={`${h} rounded-2xl border border-d-border bg-d-surface animate-pulse`}>
        <div className="h-full flex items-center justify-center">
          <div className="w-24 h-3 rounded bg-d-border" />
        </div>
      </div>
    );
  }

  function EmptyState({ icon: Icon, message }) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-d-muted">
        <Icon className="w-8 h-8 opacity-30" />
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  function renderKpis() {
    if (!data?.kpis) return null;
    const k = data.kpis;
    const spd = data.speedToLead;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users} label="Leads" value={k.totalLeads.current} changePercent={k.totalLeads.changePercent} color="#6c63ff" branding={branding} />
        <KpiCard icon={BarChart2} label="Quotes" value={k.totalQuotes.current} changePercent={k.totalQuotes.changePercent} color="#8b5cf6" branding={branding} />
        <KpiCard icon={TrendingUp} label="Contracts" value={k.totalContracts.current} changePercent={k.totalContracts.changePercent} color="#10b981" branding={branding} />
        <KpiCard icon={DollarSign} label="Revenue" value={fmt(k.totalRevenue.current)} changePercent={k.totalRevenue.changePercent} color="#10b981" branding={branding} />
        <KpiCard icon={Clock} label="Speed to Lead" value={spd?.avgMinutes ?? "—"} suffix={spd ? "min" : ""} changePercent={k.avgSpeedToLead.changePercent} color={speedColor(spd?.avgMinutes)} branding={branding} />
        <KpiCard icon={Zap} label="AI Answer Rate" value={k.aiAnswerRate.current != null ? `${k.aiAnswerRate.current}%` : "—"} changePercent={k.aiAnswerRate.changePercent} color="#06b6d4" branding={branding} />
      </div>
    );
  }

  function renderCharts() {
    if (!rc || !data) return null;
    const { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } = rc;

    const xTickKey = data.leadsPerDay?.[0]?.label ? "label" : "date";

    return (
      <>
        {/* Row 1: Leads Over Time */}
        <div className="rounded-2xl border border-d-border bg-d-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-d-primary" />
            <h3 className="text-sm font-medium text-d-muted">Leads Over Time</h3>
          </div>
          {!(data.leadsPerDay?.length) ? (
            <EmptyState icon={Users} message="No leads in this period — your first lead will appear here" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.leadsPerDay} barSize={range === "90d" || range === "all" ? 4 : 12}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                  <XAxis dataKey={xTickKey} tick={tickProps} {...axisProps}
                    interval={range === "7d" ? 0 : "preserveStartEnd"} />
                  <YAxis tick={tickProps} {...axisProps} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Leads" fill={primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 2: Lead Sources + Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-d-border bg-d-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-d-primary" />
              <h3 className="text-sm font-medium text-d-muted">Lead Sources</h3>
            </div>
            {!(data.leadsBySource?.length) ? (
              <EmptyState icon={BarChart2} message="No leads in this period" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85} paddingAngle={3}
                      label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={11}>
                      {data.leadsBySource.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-d-border bg-d-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-d-primary" />
              <h3 className="text-sm font-medium text-d-muted">Conversion Funnel</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.conversionFunnel || []} layout="vertical" margin={{ left: 80, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} horizontal={false} />
                  <XAxis type="number" tick={tickProps} {...axisProps} allowDecimals={false} />
                  <YAxis type="category" dataKey={(entry) => {
                    const val = entry.value != null ? ` (${fmtCompact(entry.value)})` : "";
                    return `${entry.stage}${val}`;
                  }} tick={{ ...tickProps, textAnchor: "end", fontSize: 10 }} width={110} {...axisProps} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-d-border bg-d-surface px-3 py-2 text-xs shadow-lg">
                        <p className="text-d-text font-medium">{d.stage}</p>
                        <p style={{ color: primary }}>Count: {d.count}</p>
                        {d.value != null && <p style={{ color: "#10b981" }}>Value: {fmt(d.value)}</p>}
                      </div>
                    );
                  }} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {(data.conversionFunnel || []).map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Revenue Trend */}
        <div className="rounded-2xl border border-d-border bg-d-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-d-primary" />
            <h3 className="text-sm font-medium text-d-muted">Revenue Trend</h3>
          </div>
          {!(data.revenuePerWeek?.length) ? (
            <EmptyState icon={DollarSign} message="No revenue data yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenuePerWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                  <XAxis dataKey="week" tick={tickProps} {...axisProps} />
                  <YAxis tick={tickProps} {...axisProps} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={primary} strokeWidth={2}
                    dot={{ fill: primary, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 4: Paid Ads — Full Campaign Analysis */}
        {data.adsInsights ? (
          <>
            {/* Ads KPI tiles */}
            <div className="rounded-2xl border border-d-border bg-d-surface p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-d-primary" />
                <h3 className="text-sm font-medium text-d-muted">Paid Ads Performance</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {[
                  { label: "Total Spend", value: fmt(data.adsInsights.totalSpend) },
                  { label: "Reach", value: (data.adsInsights.totalReach || 0).toLocaleString() },
                  { label: "Impressions", value: data.adsInsights.totalImpressions.toLocaleString() },
                  { label: "Clicks", value: data.adsInsights.totalClicks.toLocaleString() },
                  { label: "Leads", value: data.adsInsights.totalLeads },
                  { label: "CPL", value: data.adsInsights.cpl != null ? `$${data.adsInsights.cpl}` : "—" },
                  { label: "CPC", value: data.adsInsights.cpc != null ? `$${data.adsInsights.cpc}` : "—" },
                  { label: "CPM", value: data.adsInsights.cpm != null ? `$${data.adsInsights.cpm}` : "—" },
                  { label: "CTR", value: `${data.adsInsights.ctr}%` },
                  { label: "Frequency", value: data.adsInsights.frequency ?? "—" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-d-border bg-d-bg p-3 text-center">
                    <div className="text-lg font-semibold text-d-text">{m.value}</div>
                    <div className="text-[11px] text-d-muted mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Daily trend: Spend + Clicks + Leads */}
              {data.adsInsights.dailyData?.length > 0 && (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.adsInsights.dailyData} barSize={range === "90d" || range === "all" ? 3 : 8}>
                      <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={tickProps} {...axisProps}
                        interval={range === "7d" ? 0 : "preserveStartEnd"} />
                      <YAxis yAxisId="left" tick={tickProps} {...axisProps} tickFormatter={(v) => `$${v}`} />
                      <YAxis yAxisId="right" orientation="right" tick={tickProps} {...axisProps} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: mutedHex }} />
                      <Bar yAxisId="left" dataKey="spend" name="Spend ($)" fill={primary} radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="clicks" name="Clicks" fill={accent} radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="leads" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Per-campaign breakdown + Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Campaign breakdown table */}
              {data.adsInsights.campaigns?.length > 0 && (
                <div className="rounded-2xl border border-d-border bg-d-surface p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4 text-d-primary" />
                    <h3 className="text-sm font-medium text-d-muted">Per Campaign</h3>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.adsInsights.campaigns.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-d-bg/50 text-xs">
                        <div className="flex-1 min-w-0">
                          <div className="text-d-text font-medium truncate">{c.name}</div>
                          <div className="text-d-muted mt-0.5">
                            {c.reach?.toLocaleString()} reach · {c.clicks} clicks · {c.leads} leads
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <div className="text-d-text font-semibold">{fmt(c.spend)}</div>
                          <div className="text-d-muted">{c.impressions.toLocaleString()} impr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age/Gender demographics */}
              {data.adsInsights.demographics?.length > 0 && (
                <div className="rounded-2xl border border-d-border bg-d-surface p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-d-primary" />
                    <h3 className="text-sm font-medium text-d-muted">Audience Demographics</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.adsInsights.demographics.slice(0, 12)} layout="vertical" margin={{ left: 70, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={borderHex} horizontal={false} />
                        <XAxis type="number" tick={tickProps} {...axisProps} />
                        <YAxis type="category" dataKey={(d) => `${d.gender === "male" ? "M" : d.gender === "female" ? "F" : "?"} ${d.age}`}
                          tick={{ ...tickProps, fontSize: 10 }} width={70} {...axisProps} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-d-border bg-d-surface px-3 py-2 text-xs shadow-lg">
                              <p className="text-d-text font-medium">{d.gender} {d.age}</p>
                              <p style={{ color: primary }}>Impressions: {d.impressions.toLocaleString()}</p>
                              <p style={{ color: accent }}>Clicks: {d.clicks}</p>
                              <p style={{ color: "#10b981" }}>Leads: {d.leads}</p>
                              <p className="text-d-muted">Spend: {fmt(d.spend)}</p>
                            </div>
                          );
                        }} />
                        <Bar dataKey="impressions" name="Impressions" fill={primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-d-border bg-d-surface/50 p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-3 text-d-muted opacity-30" />
            <p className="text-sm font-medium text-d-text mb-1">Connect your Meta ad account</p>
            <p className="text-xs text-d-muted max-w-md mx-auto">
              Link your Facebook/Instagram ad account to see campaign performance, spend, CPL, and ROI — all inside your dashboard.
            </p>
          </div>
        )}

        {/* Row 5: AI Performance + Message Volume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-d-border bg-d-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-d-primary" />
              <h3 className="text-sm font-medium text-d-muted">AI Performance (Voice)</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.aiPerformance || []} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                  <XAxis dataKey="week" tick={tickProps} {...axisProps} />
                  <YAxis tick={tickProps} {...axisProps} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: mutedHex }} />
                  <Bar dataKey="answered" name="Answered" stackId="a" fill={primary} />
                  <Bar dataKey="missed" name="Missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-d-border bg-d-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-d-primary" />
              <h3 className="text-sm font-medium text-d-muted">Message Volume by Channel</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.messageVolume || []}>
                  <defs>
                    <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={primary} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradCall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradEmail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                  <XAxis dataKey="week" tick={tickProps} {...axisProps} />
                  <YAxis tick={tickProps} {...axisProps} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: mutedHex }} />
                  <Area type="monotone" dataKey="sms" name="SMS" stroke={primary} fill="url(#gradSms)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="call" name="Voice" stroke={accent} fill="url(#gradCall)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="email" name="Email" stroke="#f59e0b" fill="url(#gradEmail)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 6: Social Media Insights (if available) */}
        {data.socialInsights ? (
          <>
            {/* Social KPI mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Impressions", value: data.socialInsights.totalImpressions?.toLocaleString() || "0" },
                { label: "Unique Reach", value: data.socialInsights.totalReach?.toLocaleString() || "0" },
                { label: "Page Views", value: data.socialInsights.totalPageViews?.toLocaleString() || "0" },
                { label: "Engaged Users", value: data.socialInsights.totalEngaged?.toLocaleString() || "0" },
                { label: "Followers", value: data.socialInsights.followers?.toLocaleString() || "0" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-d-border bg-d-surface p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Facebook className="w-3.5 h-3.5" style={{ color: "#1877F2" }} />
                    <span className="text-[11px] text-d-muted">{m.label}</span>
                  </div>
                  <div className="text-lg font-semibold text-d-text">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Social charts: Impressions+Reach (left) + Page Views+Engagement (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-d-border bg-d-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4" style={{ color: "#1877F2" }} />
                    <h3 className="text-sm font-medium text-d-muted">
                      Impressions & Reach {data.socialInsights.pageName ? `— ${data.socialInsights.pageName}` : ""}
                    </h3>
                  </div>
                </div>
                {data.socialInsights.impressions?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.socialInsights.impressions.map((d, i) => ({
                        ...d,
                        reach: data.socialInsights.uniqueReach?.[i]?.value || 0,
                      }))}>
                        <defs>
                          <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={primary} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(v) => v?.slice(5)} tick={tickProps} {...axisProps} />
                        <YAxis tick={tickProps} {...axisProps} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: mutedHex }} />
                        <Area type="monotone" dataKey="value" name="Impressions" stroke={primary} fill="url(#gradImpressions)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="reach" name="Unique Reach" stroke={accent} fill="url(#gradReach)" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={Facebook} message="No social media data for this period" />
                )}
              </div>

              <div className="rounded-2xl border border-d-border bg-d-surface p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4" style={{ color: "#1877F2" }} />
                  <h3 className="text-sm font-medium text-d-muted">Page Views & Engagement</h3>
                </div>
                {data.socialInsights.pageViews?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.socialInsights.pageViews.map((d, i) => ({
                        ...d,
                        engaged: data.socialInsights.engagedUsers?.[i]?.value || 0,
                      }))} barSize={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(v) => v?.slice(5)} tick={tickProps} {...axisProps} />
                        <YAxis tick={tickProps} {...axisProps} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: mutedHex }} />
                        <Bar dataKey="value" name="Page Views" fill={primary} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="engaged" name="Engaged Users" fill={accent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={Globe} message="No page view data for this period" />
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* Row 6b: Instagram Insights (if available) */}
        {data.socialInsights?.instagram ? (() => {
          const ig = data.socialInsights.instagram;
          return (
            <>
              {/* IG KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "IG Followers", value: ig.followers?.toLocaleString() || "0" },
                  { label: "IG Reach", value: ig.totalReach?.toLocaleString() || "0" },
                  { label: "IG Engaged", value: ig.totalEngaged?.toLocaleString() || "0" },
                  { label: "IG Profile Views", value: ig.totalProfileViews?.toLocaleString() || "0" },
                  { label: "IG Posts", value: ig.mediaCount?.toLocaleString() || "0" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-d-border bg-d-surface p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Instagram className="w-3.5 h-3.5" style={{ color: "#E4405F" }} />
                      <span className="text-[11px] text-d-muted">{m.label}</span>
                    </div>
                    <div className="text-lg font-semibold text-d-text">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* IG Charts: Reach + Engaged + Profile Views */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-d-border bg-d-surface p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Instagram className="w-4 h-4" style={{ color: "#E4405F" }} />
                    <h3 className="text-sm font-medium text-d-muted">
                      Instagram Reach {ig.username ? `— @${ig.username}` : ""}
                    </h3>
                  </div>
                  {ig.reach?.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ig.reach.map((d, i) => ({
                          ...d,
                          engaged: ig.engagedAccounts?.[i]?.value || 0,
                        }))}>
                          <defs>
                            <linearGradient id="gradIgReach" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E4405F" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#E4405F" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(v) => v?.slice(5)} tick={tickProps} {...axisProps} />
                          <YAxis tick={tickProps} {...axisProps} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11, color: mutedHex }} />
                          <Area type="monotone" dataKey="value" name="Reach" stroke="#E4405F" fill="url(#gradIgReach)" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="engaged" name="Engaged" stroke="#833AB4" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState icon={Instagram} message="No Instagram data for this period" />
                  )}
                </div>

                <div className="rounded-2xl border border-d-border bg-d-surface p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: "#E4405F" }} />
                    <h3 className="text-sm font-medium text-d-muted">Instagram Profile Views</h3>
                  </div>
                  {ig.profileViews?.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ig.profileViews} barSize={8}>
                          <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(v) => v?.slice(5)} tick={tickProps} {...axisProps} />
                          <YAxis tick={tickProps} {...axisProps} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" name="Profile Views" fill="#E4405F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState icon={Eye} message="No profile view data for this period" />
                  )}
                </div>
              </div>
            </>
          );
        })() : null}

        {/* Row 7: Meta Pixel Website Events (if available) */}
        {data.pixelInsights?.events?.length > 0 ? (
          <div className="rounded-2xl border border-d-border bg-d-surface p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-d-primary" />
                <h3 className="text-sm font-medium text-d-muted">Website Events (Meta Pixel)</h3>
              </div>
              <div className="text-xs text-d-muted">
                <span className="font-semibold text-d-text">{data.pixelInsights.totalEvents.toLocaleString()}</span> total events
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pixelInsights.events.slice(0, 8)} layout="vertical" margin={{ left: 100, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} horizontal={false} />
                  <XAxis type="number" tick={tickProps} {...axisProps} />
                  <YAxis type="category" dataKey="name" tick={{ ...tickProps, textAnchor: "end", fontSize: 11 }} width={100} {...axisProps} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Events" fill={primary} radius={[0, 4, 4, 0]}>
                    {data.pixelInsights.events.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Row 8: Website Traffic (GA4) */}
        {data.trafficInsights ? (
          <div className="rounded-2xl border border-d-border bg-d-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4" style={{ color: primary }} />
              <span className="text-sm font-semibold text-d-text">Website Traffic</span>
              <span className="text-xs text-d-muted ml-auto">Google Analytics</span>
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl bg-d-bg p-3">
                <div className="text-xs text-d-muted mb-0.5">Sessions</div>
                <div className="text-lg font-bold text-d-text">{data.trafficInsights.totals.sessions.toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-d-bg p-3">
                <div className="text-xs text-d-muted mb-0.5">Users</div>
                <div className="text-lg font-bold text-d-text">{data.trafficInsights.totals.users.toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-d-bg p-3">
                <div className="text-xs text-d-muted mb-0.5">Pageviews</div>
                <div className="text-lg font-bold text-d-text">{data.trafficInsights.totals.pageviews.toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-d-bg p-3">
                <div className="text-xs text-d-muted mb-0.5">Bounce Rate</div>
                <div className="text-lg font-bold text-d-text">{data.trafficInsights.totals.bounceRate}%</div>
              </div>
            </div>

            {/* Daily sessions chart */}
            {data.trafficInsights.daily?.length > 1 && (
              <rc.ResponsiveContainer width="100%" height={200}>
                <rc.AreaChart data={data.trafficInsights.daily}>
                  <defs>
                    <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <rc.CartesianGrid strokeDasharray="3 3" stroke={borderHex} />
                  <rc.XAxis dataKey="date" {...axisProps} tick={tickProps} tickFormatter={(v) => v.slice(5)} />
                  <rc.YAxis {...axisProps} tick={tickProps} />
                  <rc.Tooltip content={<CustomTooltip />} />
                  <rc.Area type="monotone" dataKey="sessions" name="Sessions" stroke={primary} fill="url(#trafficGrad)" strokeWidth={2} />
                  <rc.Area type="monotone" dataKey="users" name="Users" stroke={accent} fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                </rc.AreaChart>
              </rc.ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-d-border bg-d-surface/50 p-6 text-center">
            <Globe className="w-8 h-8 mx-auto mb-3 text-d-muted opacity-30" />
            <p className="text-sm font-medium text-d-text mb-1">Website Traffic</p>
            <p className="text-xs text-d-muted max-w-md mx-auto">
              Connect Google Analytics to see visitors, pageviews, and bounce rate.
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">

        {/* Header + Range Selector + Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-d-text">Analytics</h1>
            <p className="text-sm mt-0.5 text-d-muted">Leads, revenue, and AI performance trends</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-d-border bg-d-surface p-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    range === r.value ? "text-white" : "text-d-muted hover:text-d-text"
                  }`}
                  style={range === r.value ? { backgroundColor: primary } : undefined}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={exportCSV}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-d-border bg-d-surface px-3 py-2 text-xs text-d-muted hover:text-d-text transition-colors"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 text-sm">
            Failed to load analytics: {error}
          </div>
        )}

        {(loading || !rc) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} h="h-24" />)}
            </div>
            <Skeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton /><Skeleton />
            </div>
          </div>
        ) : chartsReady ? (
          <>
            {renderKpis()}
            {renderCharts()}
          </>
        ) : (
          <div className="text-center text-d-muted py-12">No data available</div>
        )}

      </div>
    </DashboardLayout>
  );
}
