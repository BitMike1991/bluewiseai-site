// src/components/dashboard/StatCard.js

export default function StatCard({ label, value, subLabel, icon: Icon, accent }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-lg shadow-slate-950/40",
        accent ? `border-l-4 ${accent}` : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="text-2xl font-semibold text-slate-50">
            {value ?? "—"}
          </div>
          {subLabel && (
            <div className="text-[11px] text-slate-500">
              {subLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
