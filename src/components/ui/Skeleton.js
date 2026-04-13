// src/components/ui/Skeleton.js
// Skeleton loader primitives matching existing dashboard component dimensions.

export function SkeletonPulse({ className = "h-4 w-full" }) {
  return <div className={`animate-pulse rounded bg-[var(--d-border,#1e1e2e)]/50 ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4", "w-2/3"];
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonPulse key={i} className={`h-3 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "h-8 w-8" }) {
  return <div className={`animate-pulse rounded-full bg-[var(--d-border,#1e1e2e)]/50 shrink-0 ${size}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)] px-4 py-3">
      <div className="flex items-start gap-3">
        <SkeletonPulse className="h-5 w-5 mt-0.5 rounded shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonPulse className="h-2.5 w-16" />
          <SkeletonPulse className="h-7 w-20" />
          <SkeletonPulse className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <SkeletonAvatar />
      <div className="flex-1 space-y-1.5">
        <SkeletonPulse className="h-3.5 w-32" />
        <SkeletonPulse className="h-2.5 w-48" />
      </div>
      <SkeletonPulse className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ rows = 4, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)] p-4 ${className}`}>
      <SkeletonPulse className="h-4 w-28 mb-4" />
      <div className="space-y-0 divide-y divide-[var(--d-border,#1e1e2e)]/40">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonListRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHeroBanner() {
  return (
    <div className="rounded-2xl border border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)] overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--d-border,#1e1e2e)]/40">
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-5 py-5">
            <div className="flex items-center gap-3">
              <SkeletonPulse className="h-11 w-11 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonPulse className="h-2.5 w-20" />
                <SkeletonPulse className="h-6 w-24" />
                <SkeletonPulse className="h-2.5 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonOverview() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonPulse className="h-6 w-48 mb-2" />
        <SkeletonPulse className="h-4 w-64" />
      </div>
      <SkeletonHeroBanner />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard rows={6} />
        <SkeletonCard rows={6} />
      </div>
    </div>
  );
}
