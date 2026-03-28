// src/components/dashboard/StatCard.js
import { useBranding } from "./BrandingContext";
import { getBrandingStyles } from "./brandingUtils";

export default function StatCard({ label, value, subLabel, icon: Icon, accent }) {
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);

  return (
    <div
      className={["rounded-2xl border px-4 py-3 shadow-lg", accent ? `border-l-4 ${accent}` : ""].join(" ")}
      style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: styles.text.secondary }}>
            {label}
          </div>
          <div className="text-2xl font-semibold" style={{ color: styles.text.primary }}>
            {value ?? "—"}
          </div>
          {subLabel && (
            <div className="text-[11px]" style={{ color: styles.text.secondary }}>
              {subLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
