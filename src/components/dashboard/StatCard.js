// src/components/dashboard/StatCard.js

export default function StatCard({ label, value, subLabel }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-lg shadow-slate-950/40">
      <div className="flex flex-col gap-1">
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
  );
}
