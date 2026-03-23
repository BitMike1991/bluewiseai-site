// pages/api/settings/branding.js
import { getAuthContext } from "../../../lib/supabaseServer";

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("branding")
      .eq("id", customerId)
      .single();

    if (error) {
      console.error("Branding fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Merge: customer values override defaults, nulls fall back to defaults
    const customerBranding = data?.branding || {};
    const merged = { ...DEFAULT_BRANDING };
    for (const key of Object.keys(DEFAULT_BRANDING)) {
      if (customerBranding[key] !== undefined && customerBranding[key] !== null) {
        merged[key] = customerBranding[key];
      }
    }

    return res.status(200).json({ branding: merged });
  } catch (err) {
    console.error("Branding endpoint error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
