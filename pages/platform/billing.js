// pages/platform/billing.js
import { useEffect, useState } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import { useBranding } from "../../src/components/dashboard/BrandingContext";
import { getBrandingStyles } from "../../src/components/dashboard/brandingUtils";
import { CreditCard, CheckCircle, AlertTriangle, Clock, RefreshCw, Ban, DollarSign, ChevronDown } from "lucide-react";

function fmt(n) {
  if (n == null) return "\u2014";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function fmtDate(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLES = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: CheckCircle },
  grace: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: Clock },
  suspended: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: Ban },
  cancelled: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: Ban },
};

const INVOICE_STYLES = {
  pending: "text-amber-400 bg-amber-500/10",
  paid: "text-emerald-400 bg-emerald-500/10",
  overdue: "text-red-400 bg-red-500/10",
  waived: "text-slate-400 bg-slate-500/10",
};

export default function BillingPage() {
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [ownCustomerId, setOwnCustomerId] = useState(null);

  useEffect(() => {
    detectRole();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchData(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  async function detectRole() {
    setLoading(true);
    try {
      // Check if user is admin by fetching customers list
      const custRes = await fetch("/api/admin/subscription/customers");
      if (custRes.ok) {
        const custData = await custRes.json();
        setIsAdmin(true);
        setCustomers(custData.customers || []);
        // Default to first customer with a subscription, or first in list
        const firstWithSub = (custData.customers || []).find(c => c.has_subscription);
        const firstId = firstWithSub?.id || custData.customers?.[0]?.id;
        if (firstId) {
          setSelectedCustomerId(firstId);
        } else {
          setLoading(false);
        }
      } else {
        // Non-admin: fetch own status
        setIsAdmin(false);
        const statusRes = await fetch("/api/subscription/status");
        if (statusRes.ok) {
          const s = await statusRes.json();
          setOwnCustomerId(s.customer_id);
          setData({ subscription: s, invoices: [], currentPeriodPreview: null, events: [] });
        }
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to detect role:", e);
      setLoading(false);
    }
  }

  async function fetchData(custId) {
    if (!custId) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const adminRes = await fetch(`/api/admin/subscription/overview?customer_id=${custId}`);
        if (adminRes.ok) {
          const d = await adminRes.json();
          setData(d);
        } else {
          setData(null);
        }
      } else {
        const statusRes = await fetch("/api/subscription/status");
        if (statusRes.ok) {
          const s = await statusRes.json();
          setData({ subscription: s, invoices: [], currentPeriodPreview: null, events: [] });
        }
      }
    } catch (e) {
      console.error("Failed to load billing data:", e);
    }
    setLoading(false);
  }

  async function handleAction(action, payload = {}) {
    if (!selectedCustomerId && !ownCustomerId) return;
    const targetId = isAdmin ? selectedCustomerId : ownCustomerId;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/subscription/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCustomerId: targetId, ...payload }),
      });
      if (res.ok) {
        await fetchData(targetId);
      } else {
        const err = await res.json();
        alert(`Action failed: ${err.error}`);
      }
    } catch (e) {
      alert(`Action failed: ${e.message}`);
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-500">Loading billing...</div>
      </DashboardLayout>
    );
  }

  if (!data?.subscription) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header with customer selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-slate-50">Billing</h1>
            </div>
            {isAdmin && customers.length > 0 && (
              <CustomerSelector
                customers={customers}
                selectedId={selectedCustomerId}
                onChange={setSelectedCustomerId}
              />
            )}
          </div>
          <div className="flex items-center justify-center h-48 text-slate-500">No subscription data available for this customer.</div>
        </div>
      </DashboardLayout>
    );
  }

  const sub = data.subscription;
  const style = STATUS_STYLES[sub.status] || STATUS_STYLES.active;
  const StatusIcon = style.icon;
  const preview = data.currentPeriodPreview;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-slate-50">Billing</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && customers.length > 0 && (
              <CustomerSelector
                customers={customers}
                selectedId={selectedCustomerId}
                onChange={setSelectedCustomerId}
              />
            )}
            <button
              onClick={() => fetchData(isAdmin ? selectedCustomerId : ownCustomerId)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl border ${style.border} ${style.bg} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${style.text}`} />
              <div>
                <div className={`text-lg font-semibold ${style.text} capitalize`}>{sub.status}</div>
                <div className="text-xs text-slate-400">
                  Period: {fmtDate(sub.current_period_start)} — {fmtDate(sub.current_period_end)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Revenue Share</div>
              <div className="text-lg font-bold text-slate-200">
                {(parseFloat(sub.revenue_share_rate) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          {sub.last_paid_at && (
            <div className="mt-3 text-xs text-slate-500">Last paid: {fmtDate(sub.last_paid_at)}</div>
          )}
          {sub.suspended_at && (
            <div className="mt-3 text-xs text-red-400">Suspended: {fmtDate(sub.suspended_at)}</div>
          )}
        </div>

        {/* Current Period Preview (admin only) */}
        {isAdmin && preview && (
          <div className="p-6 rounded-xl border" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Current Period Preview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-500">Gross Revenue</div>
                <div className="text-lg font-bold text-slate-200">{fmt(preview.grossRevenue)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Base Fee</div>
                <div className="text-lg font-bold text-slate-200">{fmt(preview.baseFee)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Performance Fee ({(preview.rate * 100).toFixed(0)}%)</div>
                <div className="text-lg font-bold text-slate-200">{fmt(preview.performanceFee)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Due</div>
                <div className="text-lg font-bold text-blue-400">{fmt(preview.totalDue)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex gap-3">
            {(sub.status === "suspended" || sub.status === "grace") && (
              <button
                onClick={() => handleAction("reactivate")}
                disabled={actionLoading === "reactivate"}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === "reactivate" ? "Reactivating..." : "Reactivate"}
              </button>
            )}
            {(sub.status === "active" || sub.status === "grace") && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to suspend this customer? This will deactivate all their n8n workflows.")) {
                    handleAction("suspend");
                  }
                }}
                disabled={actionLoading === "suspend"}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === "suspend" ? "Suspending..." : "Suspend"}
              </button>
            )}
          </div>
        )}

        {/* Invoices Table */}
        {data.invoices?.length > 0 && (
          <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Invoices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs">
                    <th className="px-6 py-3 text-left">Invoice</th>
                    <th className="px-6 py-3 text-left">Period</th>
                    <th className="px-6 py-3 text-right">Revenue</th>
                    <th className="px-6 py-3 text-right">Base</th>
                    <th className="px-6 py-3 text-right">Perf Fee</th>
                    <th className="px-6 py-3 text-right">Total Due</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-left">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-6 py-3 font-mono text-xs text-slate-300">{inv.invoice_number}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">
                        {fmtDate(inv.period_start)} — {fmtDate(inv.period_end)}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-300">{fmt(inv.gross_revenue)}</td>
                      <td className="px-6 py-3 text-right text-slate-300">{fmt(inv.base_fee)}</td>
                      <td className="px-6 py-3 text-right text-slate-300">{fmt(inv.performance_fee)}</td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-200">{fmt(inv.amount_due)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${INVOICE_STYLES[inv.status] || ""}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">{fmtDate(inv.paid_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Log (admin only) */}
        {isAdmin && data.events?.length > 0 && (
          <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}>
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Audit Log</h2>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-64 overflow-y-auto">
              {data.events.map((evt) => (
                <div key={evt.id} className="px-6 py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500">{fmtDate(evt.created_at)}</span>
                    <span className="text-slate-300 font-medium">{evt.event_type}</span>
                    {evt.actor && <span className="text-slate-500">by {evt.actor}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function CustomerSelector({ customers, selectedId, onChange }) {
  return (
    <div className="relative">
      <select
        value={selectedId || ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
      >
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} (ID: {c.id})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}
