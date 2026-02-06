// src/components/dashboard/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Inbox,
  Phone,
  Target,
  CheckSquare,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { href: "/platform/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/leads", label: "Leads", icon: Users },
  { href: "/platform/jobs", label: "Jobs", icon: Briefcase },
  { href: "/platform/inbox", label: "Inbox", icon: Inbox },
  { href: "/platform/calls", label: "Calls", icon: Phone },
  { href: "/platform/campaigns", label: "Campaigns", icon: Target },
  { href: "/platform/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, customerName }) {
  const router = useRouter();

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
          w-64 border-r border-slate-800 bg-slate-950/95 md:bg-slate-950/90
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-xs font-bold text-white">BW</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-50">BlueWise AI</div>
                <div className="text-[10px] text-slate-500 tracking-wide">Lead Rescue Platform</div>
              </div>
            </div>
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
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
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors
                  ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 font-medium"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Customer footer */}
        {customerName && (
          <div className="px-4 py-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-300">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs text-slate-400 truncate">{customerName}</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
