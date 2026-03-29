// src/components/dashboard/ActivityFeed.js
import { useBranding } from "./BrandingContext";
import { getBrandingStyles } from "./brandingUtils";

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
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);

  if (loading) {
    return (
      <div className="rounded-2xl border border-d-border bg-d-surface px-4 py-4">
        <h3 className="mb-3 text-sm font-medium text-d-text">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse text-sm">
              <div className="mt-1 h-2 w-2 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded" />
                <div className="h-2 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm">
        No recent activity yet. Once your automations run, you'll see them here.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border px-4 py-4">
      <h3 className="mb-3 text-sm font-medium">
        Recent Activity
      </h3>
      <ul className="space-y-3 text-sm">
        {items.map((item) => {
          const timeAgo = timeAgoFromIso(item.timestamp);
          const hasLead = !!item.leadId;

          return (
            <li key={item.id} className="flex items-start gap-3">
              <div
                className="mt-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: styles.colors.primary, boxShadow: `0 0 12px ${styles.colors.primary}90` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate">
                      {item.label || item.message}
                    </div>
                    <div className="text-xs">{timeAgo}</div>
                  </div>
                  {hasLead && (
                    <a
                      href={`/platform/leads/${item.leadId}`}
                      className="shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors"
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
