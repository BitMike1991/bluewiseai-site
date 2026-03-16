// src/lib/locale.js — Locale detection from pathname
// Returns "es" | "fr" | "en"
export function getLocale(pathname) {
  if (pathname.startsWith("/es")) return "es";
  if (pathname.startsWith("/fr")) return "fr";
  return "en";
}

// Helper: returns localized href prefix
export function localePath(locale) {
  if (locale === "es") return "/es";
  if (locale === "fr") return "/fr";
  return "";
}
