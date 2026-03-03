// pages/platform/finances.js
import { useEffect, useState } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ExternalLink,
} from "lucide-react";

function formatCurrency(n) {
  return `$${(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

const CATEGORY_COLORS = {
  materials: "bg-amber-500/20 text-amber-300",
  tools: "bg-orange-500/20 text-orange-300",
  fuel: "bg-red-500/20 text-red-300",
  food: "bg-green-500/20 text-green-300",
  office: "bg-blue-500/20 text-blue-300",
  ads: "bg-violet-500/20 text-violet-300",
  labour: "bg-cyan-500/20 text-cyan-300",
  other: "bg-slate-500/20 text-slate-300",
};

function CategoryBadge({ category }) {
  const cls = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {category || "other"}
    </span>
  );
}

export default function FinancesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | payment | expense

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/finances");
        if (!res.ok) throw new Error("Failed to load");
        setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summary = data?.summary || {};
  const byPerson = data?.byPerson || {};
  const logs = (data?.logs || []).filter(
    (l) => filter === "all" || l.log_type === filter
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-50">Finances</h1>
        <p className="mt-1 text-sm text-slate-400">
          Payments, expenses, and profit tracking by person.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Payments (month)</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {loading ? "..." : formatCurrency(summary.monthPayments)}
          </p>
          <p className="text-xs text-slate-500">
            Total: {loading ? "..." : formatCurrency(summary.totalPayments)}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Expenses (month)</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {loading ? "..." : formatCurrency(summary.monthExpenses)}
          </p>
          <p className="text-xs text-slate-500">
            Total: {loading ? "..." : formatCurrency(summary.totalExpenses)}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-sky-400">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Profit (month)</span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${summary.monthProfit >= 0 ? "text-sky-400" : "text-red-400"}`}>
            {loading ? "..." : formatCurrency(summary.monthProfit)}
          </p>
          <p className="text-xs text-slate-500">
            Total: {loading ? "..." : formatCurrency(summary.totalProfit)}
          </p>
        </div>
      </div>

      {/* By Person breakdown */}
      {!loading && Object.keys(byPerson).length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-semibold text-slate-50 mb-3">By Person</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byPerson).map(([name, totals]) => (
              <div key={name} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
                <p className="text-sm font-medium text-slate-200">{name}</p>
                <div className="mt-1.5 flex items-center gap-4 text-xs">
                  <span className="text-emerald-400">
                    +{formatCurrency(totals.payments)}
                  </span>
                  <span className="text-red-400">
                    -{formatCurrency(totals.expenses)}
                  </span>
                  <span className={totals.payments - totals.expenses >= 0 ? "text-sky-400" : "text-red-400"}>
                    = {formatCurrency(totals.payments - totals.expenses)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {["all", "payment", "expense"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-slate-400 border border-slate-800 hover:border-slate-600"
            }`}
          >
            {f === "all" ? "All" : f === "payment" ? "Payments" : "Expenses"}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">By</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          log.log_type === "payment"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {log.log_type === "payment" ? "Payment" : "Expense"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-200 max-w-[240px] truncate">
                      {log.log_type === "payment"
                        ? log.client || log.note || "\u2014"
                        : log.vendor || log.note || "\u2014"}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.log_type === "expense" ? (
                        <CategoryBadge category={log.category} />
                      ) : (
                        <span className="text-xs text-slate-600">{log.method || "\u2014"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                      {log.submitted_by || "\u2014"}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${
                        log.log_type === "payment" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {log.log_type === "payment" ? "+" : "-"}
                      {formatCurrency(parseFloat(log.amount) || 0)}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.receipt_url ? (
                        <a
                          href={log.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                        >
                          <Receipt className="h-3 w-3" />
                          View
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">\u2014</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
