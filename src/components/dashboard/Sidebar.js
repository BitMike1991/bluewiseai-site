// src/components/dashboard/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useBranding } from "./BrandingContext";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Inbox,
  Phone,
  Calendar,
  Target,
  CheckSquare,
  DollarSign,
  CreditCard,
  Settings,
  BarChart2,
  X,
  ChevronsUpDown,
} from "lucide-react";

const ALL_NAV_ITEMS = [
  { key: "overview", href: "/platform/overview", label: "Overview", icon: LayoutDashboard },
  { key: "leads", href: "/platform/leads", label: "Leads", icon: Users },
  { key: "jobs", href: "/platform/jobs", label: "Jobs", icon: Briefcase },
  { key: "inbox", href: "/platform/inbox", label: "Inbox", icon: Inbox },
  { key: "calls", href: "/platform/calls", label: "Calls", icon: Phone },
  { key: "calendar", href: "/platform/calendar", label: "Calendar", icon: Calendar },
  { key: "finances", href: "/platform/finances", label: "Finances", icon: DollarSign },
  { key: "campaigns", href: "/platform/campaigns", label: "Campaigns", icon: Target },
  { key: "analytics", href: "/platform/analytics", label: "Analytics", icon: BarChart2 },
  { key: "tasks", href: "/platform/tasks", label: "Tasks", icon: CheckSquare },
  { key: "billing", href: "/platform/billing", label: "Billing", icon: CreditCard },
  { key: "settings", href: "/platform/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, customerName }) {
  const router = useRouter();
  const { branding } = useBranding();

  // Filter nav items by tenant config (null = show all)
  const visibleItems = branding.nav_items
    ? ALL_NAV_ITEMS.filter((item) => branding.nav_items.includes(item.key))
    : ALL_NAV_ITEMS;

  const sidebarBg = branding.sidebar_bg || branding.surface_color || "#0a0a12";
  const borderColor = branding.border_color || "#1e1e2e";

  // Auto-detect dark sidebar → use light nav text for contrast
  const sidebarIsDark = (() => {
    const hex = sidebarBg.replace('#', '');
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  })();
  const navText = sidebarIsDark ? '#b0b4ba' : (branding.text_secondary || '#8888aa');
  const navIcon = sidebarIsDark ? '#808590' : (branding.text_secondary || '#555577');

  return (
    <>
      {/* Backdrop overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${borderColor}` }}
      >
        {/* Header */}
        <div className="px-4 py-5" style={{ borderBottom: `1px solid ${borderColor}60` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={branding.company_display_name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: branding.primary_color, boxShadow: `0 10px 15px -3px ${branding.primary_color}30` }}
                >
                  <span className="text-xs font-bold text-white">{branding.logo_text}</span>
                </div>
              )}
              <div>
                <div className="text-sm font-semibold" style={{ color: sidebarIsDark ? '#f0f0f5' : (branding.text_primary || "#f0f0f5") }}>{branding.company_display_name}</div>
                <div className="text-[10px] tracking-wide" style={{ color: navText }}>{branding.tagline}</div>
              </div>
            </div>
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: navText }}
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tenant switcher — right below header, always visible */}
        <TenantSwitcher borderColor={borderColor} navText={navText} branding={branding} customerName={customerName} />

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive =
              router.pathname === item.href ||
              (item.href !== "/platform/overview" && router.pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose?.();
                  }
                }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                style={
                  isActive
                    ? { backgroundColor: sidebarIsDark ? `${branding.primary_color}25` : `${branding.primary_color}15`, color: sidebarIsDark ? '#ffffff' : branding.primary_color, fontWeight: 500 }
                    : { color: navText }
                }
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? (sidebarIsDark ? '#ffffff' : branding.primary_color) : navIcon }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Customer name footer (non-switching users only) */}
        {customerName && (
          <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${borderColor}60` }}>
            <div className="flex items-center gap-2.5">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                style={{ backgroundColor: `${branding.primary_color || '#6c63ff'}20`, color: branding.primary_color || '#6c63ff' }}
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

function TenantSwitcher({ borderColor, navText, branding, customerName }) {
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [canSwitch, setCanSwitch] = useState(false);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/tenants")
      .then(r => r.json())
      .then(data => {
        setTenants(data.tenants || []);
        setActiveTenant(data.activeTenant);
        setCanSwitch(data.canSwitch || false);
      })
      .catch(() => {});
  }, []);

  const handleSwitch = (id) => {
    if (id === activeTenant || switching) return;
    setSwitching(true);
    // Set cookie client-side (reliable) + reload
    document.cookie = `__active_tenant=${id};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax;Secure`;
    window.location.href = "/platform/overview";
  };

  const activeName = tenants.find(t => t.id === activeTenant)?.displayName || customerName || "Tenant";

  // Regular user (1 tenant) — no switcher, footer handled separately
  if (!canSwitch) return null;

  // Multi-tenant user — show switcher
  return (
    <div className="relative flex-shrink-0" style={{ borderBottom: `1px solid ${borderColor}60` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 transition-colors hover:opacity-80"
        disabled={switching}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
            style={{ backgroundColor: `${branding.primary_color || '#6c63ff'}20`, color: branding.primary_color || '#6c63ff' }}
          >
            {activeName.charAt(0).toUpperCase()}
          </div>
          <div className="text-xs font-medium truncate" style={{ color: navText }}>
            {switching ? "Switching..." : activeName}
          </div>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: navText }} />
      </button>

      {open && (
        <div className="absolute top-full left-2 right-2 mt-1 rounded-lg border shadow-xl overflow-hidden z-50"
          style={{ backgroundColor: branding.surface_color || '#111119', borderColor: borderColor }}
        >
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => { setOpen(false); handleSwitch(t.id); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
              style={{
                backgroundColor: t.id === activeTenant ? `${t.primaryColor}15` : 'transparent',
                color: t.id === activeTenant ? '#ffffff' : navText,
              }}
            >
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
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
