// src/components/dashboard/TopNav.js
import { useRouter } from "next/router";
import { LogOut, Menu } from "lucide-react";
import { useBranding } from "./BrandingContext";

// Map route segments to readable breadcrumbs
function getBreadcrumb(pathname) {
  const segments = pathname.replace("/platform/", "").split("/").filter(Boolean);
  if (segments.length === 0) return "Overview";
  return segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ");
}

export default function TopNav({ onLogout, onToggleSidebar, userName, customerName }) {
  const router = useRouter();
  const { branding } = useBranding();
  const breadcrumb = getBreadcrumb(router.pathname);

  const initials = userName
    ? userName.charAt(0).toUpperCase()
    : customerName
    ? customerName.charAt(0).toUpperCase()
    : "U";

  const borderColor = branding.border_color || "#1e1e2e";
  const surfaceColor = branding.surface_color || "#111119";
  const textSecondary = branding.text_secondary || "#8888aa";

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-3 backdrop-blur"
      style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: `${surfaceColor}cc` }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger menu button (mobile only) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" style={{ color: textSecondary }} />
        </button>

        <div className="text-sm font-medium" style={{ color: textSecondary }}>
          {breadcrumb}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-full border flex items-center justify-center"
            style={{ backgroundColor: `${branding.primary_color}20`, borderColor: `${branding.primary_color}30` }}
          >
            <span className="text-xs font-semibold" style={{ color: branding.primary_color }}>{initials}</span>
          </div>
          {customerName && (
            <span className="hidden sm:inline text-xs" style={{ color: textSecondary }}>{customerName}</span>
          )}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
            style={{ borderColor, color: textSecondary }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
