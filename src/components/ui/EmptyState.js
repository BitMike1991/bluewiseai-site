// src/components/ui/EmptyState.js
// Centered empty state with icon, title, description, and optional CTA.

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--d-border,#1e1e2e)]/30">
          <Icon className="h-8 w-8 text-[var(--d-muted,#8888aa)]" />
        </div>
      )}
      {title && <h3 className="text-lg font-medium text-[var(--d-text,#f0f0f5)]">{title}</h3>}
      {description && <p className="mt-1 text-sm text-[var(--d-muted,#8888aa)] text-center max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--d-primary,#6c63ff)] text-white px-4 py-2 text-sm font-medium shadow hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
