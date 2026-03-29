// src/components/dashboard/StatCard.js
import { useBranding } from "./BrandingContext";
import { getBrandingStyles } from "./brandingUtils";

export default function StatCard({ label, value, subLabel, icon: Icon, accent }) {
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);

  return (
    <div
      className={["rounded-2xl border border-d-border bg-d-surface px-4 py-3 shadow-lg text-d-text", accent ? `border-l-4 ${accent}` : ""].join(" ")}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-d-muted">
            {label}
          </div>
          <div className="text-2xl font-semibold text-d-text">
            {value ?? "—"}
          </div>
          {subLabel && (
            <div className="text-[11px] text-d-muted">
              {subLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
