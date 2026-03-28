import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";
import StatCard from "../../../src/components/dashboard/StatCard";
import { useBranding } from "../../../src/components/dashboard/BrandingContext";
import { getBrandingStyles } from "../../../src/components/dashboard/brandingUtils";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Download, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function fmt(n) {
  if (n == null) return "\u2014";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function fmtDate(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function FinancesPage() {
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finances")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Finances">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Finances">
        <p className="text-slate-400 text-center py-12">Unable to load financial data.</p>
      </DashboardLayout>
    );
  }

  const profitTrend = (data.totalProfit || 0) >= 0;

  return (
    <DashboardLayout title="Finances">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: styles.text.primary }}>Financial Overview</h1>
          <a
            href={`/api/export/accountant?month=${new Date().toISOString().slice(0, 7)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>

        {/* Unsettled Expenses Banner */}
        {(data.unsettledCount || 0) > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-300">{data.unsettledCount} unsettled expense{data.unsettledCount > 1 ? "s" : ""}</p>
              <p className="text-xs text-amber-400/70">Will be cleared on next payment received</p>
            </div>
            <span className="text-lg font-bold text-amber-400">{fmt(data.unsettledTotal)}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Revenue"
            value={fmt(data.totalRevenue)}
            subLabel={`MTD: ${fmt(data.revenueMtd)} \u00b7 WTD: ${fmt(data.revenueWtd)}`}
            icon={DollarSign}
            accent="border-l-emerald-500"
          />
          <StatCard
            label="Total Expenses"
            value={fmt(data.totalExpenses)}
            subLabel={`MTD: ${fmt(data.expensesMtd)}`}
            icon={TrendingDown}
            accent="border-l-rose-500"
          />
          <StatCard
            label="Net Profit"
            value={fmt(data.totalProfit)}
            subLabel={profitTrend ? "Profitable" : "Deficit"}
            icon={profitTrend ? TrendingUp : TrendingDown}
            accent={profitTrend ? "border-l-blue-500" : "border-l-amber-500"}
          />
          <StatCard
            label="Outstanding"
            value={fmt(data.outstandingBalance)}
            subLabel={`Collection: ${data.collectionRate}%`}
            icon={AlertCircle}
            accent="border-l-amber-500"
          />
        </div>

        {/* Tax Summary */}
        {data.taxes && (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Taxes Collected (Accounting)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Revenue HT</p>
                <p className="text-sm font-medium text-slate-200">{fmt(data.taxes.revenueHt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">TPS (5%)</p>
                <p className="text-sm font-medium text-blue-400">{fmt(data.taxes.totalTps)}</p>
                <p className="text-[10px] text-slate-600">MTD: {fmt(data.taxes.tpsMtd)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">TVQ (9.975%)</p>
                <p className="text-sm font-medium text-blue-400">{fmt(data.taxes.totalTvq)}</p>
                <p className="text-[10px] text-slate-600">MTD: {fmt(data.taxes.tvqMtd)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total Taxes</p>
                <p className="text-sm font-medium text-amber-400">{fmt(data.taxes.totalTps + data.taxes.totalTvq)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue vs Expenses Chart */}
          <div className="lg:col-span-2 rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Revenue vs Expenses (6 Months)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend} barGap={2}>
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Pie */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Payment Types</h3>
            <div className="h-64">
              {data.paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.paymentMethods.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">No payments recorded</div>
              )}
            </div>
          </div>
        </div>

        {/* By Person Ledger */}
        {data.byPerson && Object.keys(data.byPerson).length > 0 && (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Person Ledger</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.byPerson).map(([name, t]) => {
                const balance = (t.payments || 0) - (t.expenses || 0) + (t.transfersIn || 0) - (t.transfersOut || 0);
                return (
                  <div key={name} className={`rounded-xl border p-3 ${balance >= 0 ? "border-emerald-500/30 bg-emerald-950/10" : "border-rose-500/30 bg-rose-950/10"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200">{name}</p>
                      <span className={`text-sm font-bold ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {fmt(balance)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      {(t.payments || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cash received</span>
                          <span className="text-emerald-400">+{fmt(t.payments)}</span>
                        </div>
                      )}
                      {(t.expenses || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expenses</span>
                          <span className="text-rose-400">-{fmt(t.expenses)}</span>
                        </div>
                      )}
                      {(t.transfersOut || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sent</span>
                          <span className="text-rose-400">-{fmt(t.transfersOut)}</span>
                        </div>
                      )}
                      {(t.transfersIn || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Received</span>
                          <span className="text-emerald-400">+{fmt(t.transfersIn)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Clients */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Top Clients by Revenue</h3>
            {data.topClients.length > 0 ? (
              <div className="space-y-2">
                {data.topClients.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                    <div>
                      <div className="text-sm text-slate-200">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.jobId}</div>
                    </div>
                    <div className="text-sm font-medium text-emerald-400">{fmt(c.revenue)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No payment data yet</p>
            )}
          </div>

          {/* Pending Payments */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Pending Payments</h3>
            {data.pendingPayments.length > 0 ? (
              <div className="space-y-2">
                {data.pendingPayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                    <div>
                      <div className="text-sm text-slate-200">{p.client}</div>
                      <div className="text-[10px] text-slate-500">{p.jobNumber} &middot; {p.daysOverdue}d overdue</div>
                    </div>
                    <div className="text-sm font-medium text-amber-400">{fmt(p.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-emerald-400/70 text-sm">All payments collected!</p>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Expenses</h3>
            {data.recentExpenses.length > 0 ? (
              <div className="space-y-2">
                {data.recentExpenses.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                    <div>
                      <div className="text-sm text-slate-200">{e.vendor}</div>
                      <div className="text-[10px] text-slate-500">{e.category} &middot; {fmtDate(e.date)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-rose-400">{fmt(e.amount)}</div>
                      {e.receiptUrl && (
                        <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No expenses recorded</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
