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
  // Full palette
  dashboard_bg: "#0a0a12",
  surface_color: "#111119",
  border_color: "#1e1e2e",
  text_primary: "#f0f0f5",
  text_secondary: "#8888aa",
  // Per-tenant navigation (null = show all)
  nav_items: null,
};

const BrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  loading: true,
});

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch("/api/settings/branding");
        if (res.ok) {
          const data = await res.json();
          setBranding(data.branding || DEFAULT_BRANDING);
        }
      } catch (e) {
        // Fail gracefully — keep defaults
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
