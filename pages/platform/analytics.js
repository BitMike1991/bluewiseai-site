// pages/platform/analytics.js
import { useEffect, useState } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import { useBranding } from "../../src/components/dashboard/BrandingContext";
import { BarChart2, TrendingUp, Users, Phone, MessageSquare, DollarSign } from "lucide-react";

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

function getPieColors(primary) {
  return [primary || "#6c63ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
}

export default function AnalyticsPage() {
  const { branding } = useBranding();
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rc, setRc] = useState(null); // recharts module

  const primary = branding?.primary_color || "#6c63ff";
  const accent = branding?.accent_color || "#00d4aa";
  const borderHex = branding?.border_color || "#1e1e2e";
  const mutedHex = branding?.text_secondary || "#8888aa";
  const colors = getPieColors(primary);

  // Load recharts once on mount
  useEffect(() => {
    import("recharts").then((mod) => setRc(mod)).catch((err) => console.error("recharts load failed:", err));
  }, []);

  // Fetch data when range changes
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

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-d-border bg-d-surface px-3 py-2 text-xs shadow-lg">
        <p className="text-d-text font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.name === "Revenue" ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }

  function Spinner() {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-d-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  function renderCharts() {
    if (!rc || !data) return null;
    const { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } = rc;

    return (
      <>
        {/* Row 1: Leads Over Time */}
        <div className="rounded-2xl border border-d-border bg-d-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-d-primary" />
            <h3 className="text-sm font-medium text-d-muted">Leads Over Time</h3>
          </div>
          {!(data.leadsPerDay?.length) ? (
            <div className="h-64 flex items-center justify-center text-sm text-d-muted">No leads in this period</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.leadsPerDay} barSize={range === "90d" || range === "all" ? 4 : 12}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={tickProps} {...axisProps}
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
              <div className="h-64 flex items-center justify-center text-sm text-d-muted">No leads in this period</div>
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
                  <YAxis type="category" dataKey="stage" tick={{ ...tickProps, textAnchor: "end" }} width={80} {...axisProps} />
                  <Tooltip content={<CustomTooltip />} />
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
            <TrendingUp className="w-4 h-4 text-d-primary" />
            <h3 className="text-sm font-medium text-d-muted">Revenue Trend (12 Weeks)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenuePerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                <XAxis dataKey="week" tick={tickProps} {...axisProps} />
                <YAxis tick={tickProps} {...axisProps} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={primary} strokeWidth={2}
                  dot={{ fill: primary, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4: Paid Ads (if available) */}
        {data.adsInsights && (
          <>
            <div className="rounded-2xl border border-d-border bg-d-surface p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-d-primary" />
                <h3 className="text-sm font-medium text-d-muted">Paid Ads Performance</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {[
                  { label: "Spend", value: `$${data.adsInsights.totalSpend}` },
                  { label: "Impressions", value: data.adsInsights.totalImpressions.toLocaleString() },
                  { label: "Clicks", value: data.adsInsights.totalClicks.toLocaleString() },
                  { label: "Leads (Ads)", value: data.adsInsights.totalLeads },
                  { label: "CPL", value: data.adsInsights.cpl != null ? `$${data.adsInsights.cpl}` : "—" },
                  { label: "CTR", value: `${data.adsInsights.ctr}%` },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-d-border bg-d-bg p-3 text-center">
                    <div className="text-lg font-semibold text-d-text">{m.value}</div>
                    <div className="text-[11px] text-d-muted mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              {data.adsInsights.dailySpend?.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.adsInsights.dailySpend} barSize={range === "90d" || range === "all" ? 3 : 10}>
                      <CartesianGrid strokeDasharray="3 3" stroke={borderHex} vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={tickProps} {...axisProps}
                        interval={range === "7d" ? 0 : "preserveStartEnd"} />
                      <YAxis tick={tickProps} {...axisProps} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="spend" name="Spend ($)" fill={primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
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
      </>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">

        {/* Header + Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-d-text">Analytics</h1>
            <p className="text-sm mt-0.5 text-d-muted">Leads, revenue, and AI performance trends</p>
          </div>
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
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 text-sm">
            Failed to load analytics: {error}
          </div>
        )}

        {(loading || !rc) ? <Spinner /> : chartsReady ? renderCharts() : (
          <div className="text-center text-d-muted py-12">No data available</div>
        )}

      </div>
    </DashboardLayout>
  );
}
