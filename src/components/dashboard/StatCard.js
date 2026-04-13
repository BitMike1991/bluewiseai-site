// src/components/dashboard/StatCard.js
import { useBranding } from "./BrandingContext";
import { getBrandingStyles } from "./brandingUtils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-emerald-400" },
  down: { icon: TrendingDown, color: "text-rose-400" },
  flat: { icon: Minus, color: "text-d-muted" },
};

export default function StatCard({ label, value, subLabel, icon: Icon, accent, trend, onClick }) {
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);
  const trendInfo = trend ? TREND_CONFIG[trend.direction] || TREND_CONFIG.flat : null;
  const TrendIcon = trendInfo?.icon;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={[
        "rounded-2xl border border-d-border bg-d-surface px-4 py-3 shadow-lg text-d-text transition-colors duration-200",
        "hover:border-d-primary/30",
        accent ? `border-l-4 ${accent}` : "",
        onClick ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-d-muted">
            {label}
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold text-d-text tabular-nums">
              {value ?? "—"}
            </div>
            {trendInfo && trend.value && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trendInfo.color}`}>
                <TrendIcon className="h-3 w-3" />
                {trend.value}
              </span>
            )}
          </div>
          {subLabel && (
            <div className="text-[11px] text-d-muted">
              {subLabel}
            </div>
          )}
        </div>
      </div>
    </Tag>
  );
}
