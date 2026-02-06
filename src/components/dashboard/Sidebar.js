// src/components/dashboard/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { href: "/platform/overview", label: "Overview" },
  { href: "/platform/leads", label: "Leads" },
  { href: "/platform/jobs", label: "Jobs" },
  { href: "/platform/inbox", label: "Inbox" },
  { href: "/platform/calls", label: "Calls" },
  { href: "/platform/campaigns", label: "Campaigns" },
  { href: "/platform/tasks", label: "Tasks" },
  { href: "/platform/settings", label: "Settings" },
];

export default function Sidebar({ isOpen, onClose }) {
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
          w-64 border-r border-slate-800 bg-slate-950/95 md:bg-slate-950/90 px-4 py-6
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">
              BlueWise AI
            </div>
            <div className="text-lg font-semibold text-slate-50">
              Lead Rescue Platform
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800/70 transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                // Close sidebar on mobile when nav item clicked
                if (window.innerWidth < 768) {
                  onClose?.();
                }
              }}
              className={`flex items-center rounded-xl px-3 py-2 text-sm transition
                ${
                  isActive
                    ? "bg-blue-600/90 text-white shadow-[0_0_18px_rgba(37,99,235,0.6)]"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
    </>
  );
}
