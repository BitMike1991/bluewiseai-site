import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";
import StatCard from "../../../src/components/dashboard/StatCard";
import { Target, Star, Users, Clock, Send, MessageSquare, CheckCircle } from "lucide-react";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtShortDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function typeLabel(t) {
  const map = {
    unsigned_contract: "Contract Follow-up",
    unpaid_deposit: "Deposit Follow-up",
    review_request: "Review Request",
    referral_request: "Referral Request",
    payment_reminder: "Payment Reminder",
  };
  return map[t] || (t || "—").replace(/_/g, " ");
}

function typeBadgeColor(t) {
  const map = {
    unsigned_contract: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    unpaid_deposit: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    review_request: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    referral_request: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    payment_reminder: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  };
  return map[t] || "bg-slate-700/60 text-slate-300 border-slate-500/40";
}

function statusBadge(status) {
  if (status === "sent") return "bg-emerald-500/15 text-emerald-300";
  if (status === "scheduled" || status === "pending") return "bg-amber-500/15 text-amber-300";
  if (status === "failed") return "bg-rose-500/15 text-rose-300";
  return "bg-slate-700/60 text-slate-300";
}

function eventTypeLabel(t) {
  const map = {
    start_job: "Job Started",
    update_progress: "Progress Updated",
    complete_job: "Job Completed",
    mark_paid: "Payment Received",
    contract_signed: "Contract Signed",
    deposit_paid: "Deposit Paid",
    quote_sent: "Quote Sent",
    contract_generated: "Contract Generated",
    job_created: "Job Created",
  };
  return map[t] || (t || "—").replace(/_/g, " ");
}

export default function CampaignsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("followups");

  useEffect(() => {
    fetch("/api/campaigns")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Campaigns">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Campaigns">
        <p className="text-slate-400 text-center py-12">Unable to load campaign data.</p>
      </DashboardLayout>
    );
  }

  const { stats, activeFollowups, reviewRequests, referrals, recentActivity } = data;
  const tabs = [
    { key: "followups", label: "Follow-ups", count: activeFollowups.length },
    { key: "reviews", label: "Reviews", count: reviewRequests.length },
    { key: "referrals", label: "Referrals", count: referrals.length },
    { key: "activity", label: "Activity", count: recentActivity.length },
  ];

  return (
    <DashboardLayout title="Campaigns">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-50">Campaigns & Automation</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Pending Follow-ups"
            value={stats.pendingFollowups}
            subLabel={`${stats.sentFollowups} sent total`}
            icon={Clock}
            accent="border-l-amber-500"
          />
          <StatCard
            label="Reviews Sent"
            value={stats.reviewsSent}
            subLabel={`${stats.reviewsReceived} responses`}
            icon={Star}
            accent="border-l-violet-500"
          />
          <StatCard
            label="Avg Rating"
            value={stats.avgRating || "—"}
            subLabel={stats.avgRating ? "out of 5" : "No ratings yet"}
            icon={Star}
            accent="border-l-emerald-500"
          />
          <StatCard
            label="Referrals"
            value={stats.totalReferrals}
            subLabel="Total generated"
            icon={Users}
            accent="border-l-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-slate-800 text-slate-100 border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
          {activeTab === "followups" && (
            <div className="divide-y divide-slate-800/50">
              {activeFollowups.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No follow-ups recorded yet</div>
              ) : activeFollowups.map(f => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Send className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeBadgeColor(f.type)}`}>
                        {typeLabel(f.type)}
                      </span>
                      {f.payload?.client_name && (
                        <span className="ml-2 text-sm text-slate-200">{f.payload.client_name}</span>
                      )}
                      {f.payload?.job_id && (
                        <span className="ml-1 text-xs text-slate-500">({f.payload.job_id})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(f.status)}`}>
                      {f.status || "unknown"}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {f.sentAt ? fmtDate(f.sentAt) : f.scheduledFor ? `Due ${fmtShortDate(f.scheduledFor)}` : fmtDate(f.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="divide-y divide-slate-800/50">
              {reviewRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No review requests sent yet</div>
              ) : reviewRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Star className={`w-4 h-4 flex-shrink-0 ${r.rating ? "text-amber-400" : "text-slate-500"}`} />
                    <div>
                      <span className="text-sm text-slate-200">{r.client}</span>
                      <span className="ml-2 text-xs text-slate-500">{r.jobNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.rating && (
                      <span className="text-sm font-medium text-amber-400">{r.rating}/5</span>
                    )}
                    {r.googleClicked && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-300">Google</span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${r.respondedAt ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {r.respondedAt ? "Responded" : "Pending"}
                    </span>
                    <span className="text-xs text-slate-500">{fmtShortDate(r.sentAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="divide-y divide-slate-800/50">
              {referrals.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No referrals yet</div>
              ) : referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-slate-200">{r.referrerName}</span>
                      <span className="mx-1 text-slate-500">&rarr;</span>
                      <span className="text-sm text-emerald-300">{r.referredName || r.referredPhone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      r.status === "converted" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/60 text-slate-300"
                    }`}>
                      {r.status || "new"}
                    </span>
                    <span className="text-xs text-slate-500">{fmtShortDate(r.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="divide-y divide-slate-800/50">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No recent automation activity</div>
              ) : recentActivity.map(a => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-slate-200">{a.client}</span>
                      <span className="ml-2 text-xs text-slate-500">{a.jobNumber}</span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40">
                        {eventTypeLabel(a.eventType)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{fmtDate(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
