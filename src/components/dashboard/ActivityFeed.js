// src/components/dashboard/ActivityFeed.js

function timeAgoFromIso(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs)) return "";

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}min ago`;
  return "Just now";
}

export default function ActivityFeed({ items, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
        <h3 className="mb-3 text-sm font-medium text-slate-100">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 animate-pulse text-sm"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-slate-700" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded bg-slate-800" />
                <div className="h-2 w-20 rounded bg-slate-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-500">
        No recent activity yet. Once your automations run, you’ll see them here.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
      <h3 className="mb-3 text-sm font-medium text-slate-100">
        Recent Activity
      </h3>
      <ul className="space-y-3 text-sm">
        {items.map((item) => {
          const timeAgo = timeAgoFromIso(item.timestamp);
          const hasLead = !!item.leadId;

          return (
            <li key={item.id} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-slate-200 truncate">
                      {item.label || item.message}
                    </div>
                    <div className="text-xs text-slate-500">{timeAgo}</div>
                  </div>
                  {hasLead && (
                    <a
                      href={`/platform/leads/${item.leadId}`}
                      className="shrink-0 rounded-lg border border-sky-500/60 px-2 py-1 text-[11px] font-medium text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
                    >
                      View lead
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
