// pages/api/settings/branding.js
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";

// Keys a scoped division user (role=manager/employee) is allowed to see.
// Owner/admin always see everything the tenant's branding.nav_items allows.
const SCOPED_ROLE_ALLOWED_NAV_KEYS = new Set([
  'overview',
  'leads',
  'jobs',
  'inbox',
  'calls',
  'calendar',
  'tasks',
]);

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

  const { supabase, customerId, user, role, divisionId } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("branding, enabled_hub_tools")
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

    let enabledHubTools = Array.isArray(data?.enabled_hub_tools) ? data.enabled_hub_tools : [];
    let division = null;

    // If the caller is scoped to a division, intersect both nav_items and
    // enabled_hub_tools with the division's settings.
    const isScoped = role && role !== 'owner' && role !== 'admin';
    if (isScoped && divisionId != null) {
      const admin = getSupabaseServerClient();
      const { data: divRow } = await admin
        .from('divisions')
        .select('id, slug, name, enabled_hub_tools, active')
        .eq('id', divisionId)
        .eq('customer_id', customerId)
        .maybeSingle();
      if (divRow) {
        division = { id: divRow.id, slug: divRow.slug, name: divRow.name, active: !!divRow.active };
        const divTools = Array.isArray(divRow.enabled_hub_tools) ? divRow.enabled_hub_tools : [];
        // Intersection: a tool must be enabled both at tenant and division level
        enabledHubTools = enabledHubTools.filter((t) => divTools.includes(t));
      }
    }

    // Scoped users get a hard-locked nav_items whitelist
    if (isScoped) {
      const tenantNav = Array.isArray(merged.nav_items) ? merged.nav_items : null;
      const allowed = Array.from(SCOPED_ROLE_ALLOWED_NAV_KEYS);
      merged.nav_items = tenantNav
        ? tenantNav.filter((k) => SCOPED_ROLE_ALLOWED_NAV_KEYS.has(k))
        : allowed;
    }

    res.setHeader("Cache-Control", "private, max-age=300, stale-while-revalidate=600");
    return res.status(200).json({
      branding: merged,
      enabledHubTools,
      role: role || 'owner',
      divisionId: divisionId || null,
      division,
    });
  } catch (err) {
    console.error("Branding endpoint error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
