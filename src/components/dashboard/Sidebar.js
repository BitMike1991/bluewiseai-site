// src/components/dashboard/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useBranding } from "./BrandingContext";
import {
  LayoutDashboard, Users, Briefcase, Inbox, Phone, Calendar,
  Target, CheckSquare, DollarSign, CreditCard, Settings, BarChart2,
  X, ChevronsUpDown, PanelLeftClose, PanelLeft,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "CRM",
    items: [
      { key: "overview", href: "/platform/overview", label: "Overview", icon: LayoutDashboard },
      { key: "leads", href: "/platform/leads", label: "Leads", icon: Users },
      { key: "jobs", href: "/platform/jobs", label: "Jobs", icon: Briefcase },
      { key: "inbox", href: "/platform/inbox", label: "Inbox", icon: Inbox, badgeKey: "inbox" },
      { key: "calls", href: "/platform/calls", label: "Calls", icon: Phone, badgeKey: "calls" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "calendar", href: "/platform/calendar", label: "Calendar", icon: Calendar },
      { key: "finances", href: "/platform/finances", label: "Finances", icon: DollarSign },
      { key: "campaigns", href: "/platform/campaigns", label: "Campaigns", icon: Target },
      { key: "analytics", href: "/platform/analytics", label: "Analytics", icon: BarChart2 },
      { key: "tasks", href: "/platform/tasks", label: "Tasks", icon: CheckSquare, badgeKey: "tasks" },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "billing", href: "/platform/billing", label: "Billing", icon: CreditCard },
      { key: "settings", href: "/platform/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export default function Sidebar({ isOpen, onClose, customerName }) {
  const router = useRouter();
  const { branding } = useBranding();
  const [collapsed, setCollapsed] = useState(false);
  const [badges, setBadges] = useState({});

  // Load collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  // Fetch badge counts
  useEffect(() => {
    async function loadBadges() {
      try {
        const res = await fetch("/api/sidebar-badges");
        if (res.ok) setBadges(await res.json());
      } catch {}
    }
    loadBadges();
    const interval = setInterval(loadBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
  };

  // Filter nav items by tenant config
  const visibleKeys = branding.nav_items ? new Set(branding.nav_items) : null;

  const sidebarBg = branding.sidebar_bg || branding.surface_color || "#0a0a12";
  const borderColor = branding.border_color || "#1e1e2e";
  const primaryColor = branding.primary_color || "#6c63ff";

  const sidebarIsDark = (() => {
    const hex = sidebarBg.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  })();
  const navText = sidebarIsDark ? "#b0b4ba" : (branding.text_secondary || "#8888aa");
  const navIcon = sidebarIsDark ? "#808590" : (branding.text_secondary || "#555577");

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          ${sidebarWidth} h-screen flex flex-col
          transform transition-all duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${borderColor}` }}
      >
        {/* Header */}
        <div className="px-3 py-4" style={{ borderBottom: `1px solid ${borderColor}60` }}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-2.5"}`}>
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.company_display_name} className="h-8 w-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg shrink-0"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}30` }}
                >
                  <span className="text-xs font-bold text-white">{branding.logo_text}</span>
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: sidebarIsDark ? "#f0f0f5" : (branding.text_primary || "#f0f0f5") }}>
                    {branding.company_display_name}
                  </div>
                  <div className="text-[10px] tracking-wide truncate" style={{ color: navText }}>{branding.tagline}</div>
                </div>
              )}
            </div>
            <button onClick={onClose} className="md:hidden p-1.5 rounded-lg transition-colors" style={{ color: navText }} aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tenant switcher */}
        <TenantSwitcher borderColor={borderColor} navText={navText} branding={branding} customerName={customerName} collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-2 py-3 overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => {
            const sectionItems = section.items.filter((item) => !visibleKeys || visibleKeys.has(item.key));
            if (sectionItems.length === 0) return null;
            return (
              <div key={section.label}>
                {si > 0 && <div className="mx-2 my-2 border-t" style={{ borderColor: `${borderColor}40` }} />}
                {!collapsed && (
                  <div className="px-3 mt-1 mb-1 text-[9px] uppercase tracking-widest" style={{ color: `${navText}80` }}>
                    {section.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {sectionItems.map((item) => {
                    const isActive = router.pathname === item.href ||
                      (item.href !== "/platform/overview" && router.pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;
                    const badgeVal = item.badgeKey ? badges[item.badgeKey] : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => { if (typeof window !== "undefined" && window.innerWidth < 768) onClose?.(); }}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${collapsed ? "justify-center" : ""}`}
                        style={
                          isActive
                            ? { backgroundColor: sidebarIsDark ? `${primaryColor}25` : `${primaryColor}15`, color: sidebarIsDark ? "#ffffff" : primaryColor, fontWeight: 500 }
                            : { color: navText }
                        }
                        title={collapsed ? item.label : undefined}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = `${borderColor}30`; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = ""; }}
                      >
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{ color: isActive ? (sidebarIsDark ? "#ffffff" : primaryColor) : navIcon }}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {badgeVal > 0 && (
                              <span
                                className="text-[9px] font-semibold rounded-full px-1.5 min-w-[18px] text-center text-white"
                                style={{ backgroundColor: item.badgeKey === "calls" ? "#f43f5e" : primaryColor }}
                              >
                                {badgeVal > 99 ? "99+" : badgeVal}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && badgeVal > 0 && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ backgroundColor: item.badgeKey === "calls" ? "#f43f5e" : primaryColor }} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:block flex-shrink-0 px-2 py-2" style={{ borderTop: `1px solid ${borderColor}60` }}>
          <button
            onClick={toggleCollapsed}
            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs transition-colors duration-150 ${collapsed ? "justify-center" : ""}`}
            style={{ color: navText }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${borderColor}30`; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Customer name footer */}
        {!collapsed && customerName && (
          <div className="flex-shrink-0 px-3 py-2.5" style={{ borderTop: `1px solid ${borderColor}60` }}>
            <div className="flex items-center gap-2.5">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs truncate" style={{ color: navText }}>{customerName}</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function TenantSwitcher({ borderColor, navText, branding, customerName, collapsed }) {
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [canSwitch, setCanSwitch] = useState(false);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => {
        setTenants(data.tenants || []);
        setActiveTenant(data.activeTenant);
        setCanSwitch(data.canSwitch || false);
      })
      .catch(() => {});
  }, []);

  const handleSwitch = (id) => {
    if (id === activeTenant || switching) return;
    setSwitching(true);
    document.cookie = `__active_tenant=${id};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax;Secure`;
    window.location.href = "/platform/overview";
  };

  const activeName = tenants.find((t) => t.id === activeTenant)?.displayName || customerName || "Tenant";

  if (!canSwitch) return null;

  return (
    <div className="relative flex-shrink-0" style={{ borderBottom: `1px solid ${borderColor}60` }}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2.5 flex items-center gap-2 transition-colors hover:opacity-80 ${collapsed ? "justify-center" : "justify-between"}`}
        disabled={switching}
      >
        <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "justify-center" : ""}`}>
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
            style={{ backgroundColor: `${branding.primary_color || "#6c63ff"}20`, color: branding.primary_color || "#6c63ff" }}
          >
            {activeName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="text-xs font-medium truncate" style={{ color: navText }}>
              {switching ? "Switching..." : activeName}
            </div>
          )}
        </div>
        {!collapsed && <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" style={{ color: navText }} />}
      </button>

      {open && (
        <div
          className="absolute top-full left-2 right-2 mt-1 rounded-lg border shadow-xl overflow-hidden z-50"
          style={{ backgroundColor: branding.surface_color || "#111119", borderColor }}
        >
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => { setOpen(false); handleSwitch(t.id); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
              style={{
                backgroundColor: t.id === activeTenant ? `${t.primaryColor}15` : "transparent",
                color: t.id === activeTenant ? "#ffffff" : navText,
              }}
            >
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ backgroundColor: `${t.primaryColor}25`, color: t.primaryColor }}
              >
                {t.logoText}
              </div>
              <span className="text-xs truncate">{t.displayName}</span>
              {t.id === activeTenant && (
                <span className="ml-auto text-[9px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: `${t.primaryColor}20`, color: t.primaryColor }}>
                  active
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
