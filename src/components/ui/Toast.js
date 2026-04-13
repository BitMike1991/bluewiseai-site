// src/components/ui/Toast.js
import { useToastState } from "./ToastContext";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    border: "border-l-emerald-500",
    iconColor: "text-emerald-400",
  },
  error: {
    icon: XCircle,
    border: "border-l-rose-500",
    iconColor: "text-rose-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-amber-500",
    iconColor: "text-amber-400",
  },
  info: {
    icon: Info,
    border: "border-l-[var(--d-primary,#6c63ff)]",
    iconColor: "text-[var(--d-primary,#6c63ff)]",
  },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastState();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const v = VARIANTS[toast.variant] || VARIANTS.info;
        const Icon = v.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border border-l-4 ${v.border} border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)] px-4 py-3 shadow-2xl animate-[slideIn_200ms_ease-out]`}
          >
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${v.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--d-text,#f0f0f5)]">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => { toast.action.onClick?.(); dismiss(toast.id); }}
                  className="mt-1 text-xs font-medium text-[var(--d-primary,#6c63ff)] hover:underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 p-0.5 rounded hover:bg-[var(--d-border,#1e1e2e)] transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5 text-[var(--d-muted,#8888aa)]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
