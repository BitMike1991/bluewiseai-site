// src/components/ui/ToastContext.js
import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((variant, message, options = {}) => {
    const id = ++toastId;
    const duration = options.action ? null : (options.duration || (variant === "error" ? 6000 : 4000));

    setToasts((prev) => {
      const next = [...prev, { id, variant, message, action: options.action }];
      return next.length > 3 ? next.slice(-3) : next;
    });

    if (duration) {
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, opts) => addToast("success", msg, opts),
    error: (msg, opts) => addToast("error", msg, opts),
    warning: (msg, opts) => addToast("warning", msg, opts),
    info: (msg, opts) => addToast("info", msg, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

export function useToastState() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastState must be used within ToastProvider");
  return { toasts: ctx.toasts, dismiss: ctx.dismiss };
}
