// src/lib/dashboardUtils.js
// Single source of truth for shared dashboard utility functions.
// Every page imports from here — no local copies allowed.

const AVATAR_COLORS = [
  "bg-d-primary/20 text-blue-500",
  "bg-emerald-500/20 text-emerald-500",
  "bg-violet-500/20 text-violet-500",
  "bg-amber-500/20 text-amber-500",
  "bg-rose-500/20 text-rose-500",
  "bg-cyan-500/20 text-cyan-500",
  "bg-pink-500/20 text-pink-500",
  "bg-indigo-500/20 text-indigo-500",
];

export function getAvatarColor(name) {
  let hash = 0;
  const str = (name || "").toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitial(name) {
  if (!name || name === "null" || name === "undefined") return "?";
  return name.charAt(0).toUpperCase();
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function getSourceLabel(source) {
  if (!source) return null;
  const map = {
    telnyx_sms: "SMS",
    telnyx_voice: "Voice",
    vapi: "Voice AI",
    retell: "Voice AI",
    web: "Web",
    manual: "Manual",
    referral: "Referral",
    meta_lead_ad: "Meta Ad",
  };
  return map[source] || source;
}

export function hexToRgb(hex) {
  const h = (hex || "#6c63ff").replace("#", "");
  return `${parseInt(h.slice(0, 2), 16)} ${parseInt(h.slice(2, 4), 16)} ${parseInt(h.slice(4, 6), 16)}`;
}

export function formatCurrency(n) {
  if (n == null) return "$0";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}
