// src/components/dashboard/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { href: "/platform/overview", label: "Overview" },
  { href: "/platform/leads", label: "Leads" },
  { href: "/platform/inbox", label: "Inbox" },
  { href: "/platform/calls", label: "Calls" },
  { href: "/platform/campaigns", label: "Campaigns" },
  { href: "/platform/tasks", label: "Tasks" },
  { href: "/platform/settings", label: "Settings" },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/90 px-4 py-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-slate-500">
          BlueWise AI
        </div>
        <div className="text-lg font-semibold text-slate-50">
          Lead Rescue Platform
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}
