// src/components/dashboard/TopNav.js
import { useRouter } from "next/router";
import { LogOut, Menu } from "lucide-react";

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
  const breadcrumb = getBreadcrumb(router.pathname);

  const initials = userName
    ? userName.charAt(0).toUpperCase()
    : customerName
    ? customerName.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 md:px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {/* Hamburger menu button (mobile only) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800/70 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </button>

        <div className="text-sm font-medium text-slate-300">
          {breadcrumb}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-400">{initials}</span>
          </div>
          {customerName && (
            <span className="hidden sm:inline text-xs text-slate-400">{customerName}</span>
          )}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
