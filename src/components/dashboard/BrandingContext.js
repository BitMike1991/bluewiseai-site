// src/components/dashboard/BrandingContext.js
import { createContext, useContext, useState, useEffect } from "react";

const DEFAULT_BRANDING = {
  logo_url: null,
  logo_text: "BW",
  company_display_name: "BlueWise AI",
  tagline: "Lead Rescue Platform",
  primary_color: "#6c63ff",
  accent_color: "#00d4aa",
  sidebar_bg: null,
  favicon_url: null,
  dashboard_bg: "#0a0a12",
  surface_color: "#111119",
  border_color: "#1e1e2e",
  text_primary: "#f0f0f5",
  text_secondary: "#8888aa",
  nav_items: null,
};

const CACHE_KEY = "bw-branding-cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function loadCached() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { branding, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return branding;
  } catch { return null; }
}

function saveCache(branding) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ branding, ts: Date.now() }));
  } catch {}
}

const BrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  enabledHubTools: [],
  loading: true,
});

const HUB_CACHE_KEY = "bw-hub-tools-cache";

function loadCachedHubTools() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HUB_CACHE_KEY);
    if (!raw) return null;
    const { tools, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return tools;
  } catch { return null; }
}

function saveHubToolsCache(tools) {
  try {
    localStorage.setItem(HUB_CACHE_KEY, JSON.stringify({ tools, ts: Date.now() }));
  } catch {}
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(() => loadCached() || DEFAULT_BRANDING);
  const [enabledHubTools, setEnabledHubTools] = useState(() => loadCachedHubTools() || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch("/api/settings/branding");
        if (res.ok) {
          const data = await res.json();
          const fresh = data.branding || DEFAULT_BRANDING;
          const tools = Array.isArray(data.enabledHubTools) ? data.enabledHubTools : [];
          setBranding(fresh);
          setEnabledHubTools(tools);
          saveCache(fresh);
          saveHubToolsCache(tools);
        }
      } catch {
        // Fail gracefully — keep cached or defaults
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, enabledHubTools, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

export function clearBrandingCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(HUB_CACHE_KEY);
  } catch {}
}
