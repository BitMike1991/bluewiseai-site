// src/components/dashboard/TopNav.js
import Link from "next/link";

export default function TopNav({ onLogout, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 md:px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {/* Hamburger menu button (mobile only) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800/70 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div className="h-8 w-8 rounded-lg bg-blue-600/80 shadow-[0_0_16px_rgba(37,99,235,0.8)]" />
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
            BLUEWISE AI
          </span>
          <span className="text-sm font-semibold text-slate-50">
            Lead & Conversation Command Center
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="hidden sm:inline">
          Last synced: <span className="text-slate-200">just now</span>
        </span>

        <Link
          href="/"
          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-blue-500 hover:text-blue-300"
        >
          Back to site
        </Link>

        {onLogout && (
          <button
            onClick={onLogout}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-red-500 hover:text-red-300"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
