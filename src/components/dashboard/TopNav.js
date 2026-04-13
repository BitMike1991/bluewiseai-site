// src/components/dashboard/TopNav.js
import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useBranding } from "./BrandingContext";
import {
  LogOut, Menu, Search, Bell, Plus, Settings, CreditCard,
  Users, CheckSquare, Briefcase, X, ChevronRight,
} from "lucide-react";

function getBreadcrumbs(pathname) {
  const segments = pathname.replace("/platform/", "").split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Overview", href: "/platform/overview" }];
  return segments.map((s, i) => {
    const href = "/platform/" + segments.slice(0, i + 1).join("/");
    // Hide UUIDs and dynamic IDs
    const isId = s.length > 8 && /[0-9a-f-]{8,}/.test(s);
    const label = isId ? "Detail" : s.charAt(0).toUpperCase() + s.slice(1);
    return { label, href, isLast: i === segments.length - 1 };
  });
}

function Dropdown({ open, onClose, children, align = "right", className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-2 z-50 ${className}`}>
      {children}
    </div>
  );
}

function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    if (!open) { setQuery(""); setResults(null); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) setResults(await res.json());
      } catch {} finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sections = [
    { key: "leads", label: "Leads", icon: Users, items: results?.leads || [] },
    { key: "jobs", label: "Jobs", icon: Briefcase, items: results?.jobs || [] },
    { key: "tasks", label: "Tasks", icon: CheckSquare, items: results?.tasks || [] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--d-border,#1e1e2e)]">
          <Search className="h-5 w-5 text-[var(--d-muted,#8888aa)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, jobs, tasks..."
            className="flex-1 bg-transparent text-sm text-[var(--d-text,#f0f0f5)] placeholder:text-[var(--d-muted,#8888aa)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-[var(--d-muted,#8888aa)] border border-[var(--d-border,#1e1e2e)] rounded">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() && (
            <p className="text-xs text-[var(--d-muted,#8888aa)] text-center py-8">Start typing to search...</p>
          )}
          {loading && <p className="text-xs text-[var(--d-muted,#8888aa)] text-center py-4">Searching...</p>}
          {results && !loading && sections.map((sec) => (
            sec.items.length > 0 && (
              <div key={sec.key} className="mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase tracking-widest text-[var(--d-muted,#8888aa)]">
                  <sec.icon className="h-3 w-3" /> {sec.label}
                </div>
                {sec.items.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onClose(); router.push(item.href || `/platform/${sec.key}/${item.id}`); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-[var(--d-border,#1e1e2e)]/30 transition-colors text-[var(--d-text,#f0f0f5)]"
                  >
                    {item.name || item.title || item.label}
                    {item.subtitle && <span className="text-xs text-[var(--d-muted,#8888aa)] ml-auto">{item.subtitle}</span>}
                  </button>
                ))}
              </div>
            )
          ))}
          {results && !loading && sections.every((s) => s.items.length === 0) && (
            <p className="text-xs text-[var(--d-muted,#8888aa)] text-center py-8">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TopNav({ onLogout, onToggleSidebar, userName, customerName }) {
  const router = useRouter();
  const { branding } = useBranding();
  const breadcrumbs = getBreadcrumbs(router.pathname);

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = userName
    ? userName.charAt(0).toUpperCase()
    : customerName
    ? customerName.charAt(0).toUpperCase()
    : "U";

  const borderColor = branding.border_color || "#1e1e2e";
  const surfaceColor = branding.surface_color || "#111119";
  const textSecondary = branding.text_secondary || "#8888aa";
  const primaryColor = branding.primary_color || "#6c63ff";

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Fetch notification count
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.items || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const closeAll = useCallback(() => {
    setNotifOpen(false);
    setCreateOpen(false);
    setUserMenuOpen(false);
  }, []);

  const handleNotifOpen = () => {
    closeAll();
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0) {
      setUnreadCount(0);
      fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
    }
  };

  const createActions = [
    { label: "New Lead", icon: Users, action: () => router.push("/platform/leads?create=true") },
    { label: "New Task", icon: CheckSquare, action: () => router.push("/platform/tasks?create=true") },
    { label: "New Job", icon: Briefcase, action: () => router.push("/platform/jobs?create=true") },
  ];

  return (
    <>
      <header
        className="flex items-center justify-between px-4 md:px-6 py-2.5 backdrop-blur"
        style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: `${surfaceColor}cc` }}
      >
        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" style={{ color: textSecondary }} />
          </button>
          <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" style={{ color: textSecondary }} />}
                {crumb.isLast ? (
                  <span className="truncate font-medium" style={{ color: branding.text_primary || "#f0f0f5" }}>{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="truncate hover:underline" style={{ color: textSecondary }}>{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Center: Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors hover:border-opacity-60"
          style={{ borderColor, color: textSecondary }}
        >
          <Search className="h-4 w-4" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded border" style={{ borderColor }}>
            ⌘K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Search"
          >
            <Search className="w-4.5 h-4.5" style={{ color: textSecondary }} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotifOpen}
              className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" style={{ color: textSecondary }} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2" style={{ ringColor: surfaceColor }} />
              )}
            </button>
            <Dropdown open={notifOpen} onClose={() => setNotifOpen(false)} className="w-72 rounded-xl border shadow-2xl overflow-hidden" align="right">
              <div style={{ backgroundColor: surfaceColor, borderColor }}>
                <div className="px-3 py-2.5 border-b" style={{ borderColor }}>
                  <p className="text-xs font-semibold" style={{ color: branding.text_primary || "#f0f0f5" }}>Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-center py-6" style={{ color: textSecondary }}>All caught up</p>
                  ) : (
                    notifications.slice(0, 8).map((n, i) => (
                      <button
                        key={n.id || i}
                        onClick={() => { setNotifOpen(false); if (n.href) router.push(n.href); }}
                        className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-white/5"
                        style={{ color: branding.text_primary || "#f0f0f5", borderBottom: `1px solid ${borderColor}30` }}
                      >
                        {n.message || n.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </Dropdown>
          </div>

          {/* Quick Create */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setCreateOpen(!createOpen); }}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              aria-label="Create new"
            >
              <Plus className="w-4.5 h-4.5" style={{ color: textSecondary }} />
            </button>
            <Dropdown open={createOpen} onClose={() => setCreateOpen(false)} className="w-44 rounded-xl border shadow-2xl overflow-hidden" align="right">
              <div style={{ backgroundColor: surfaceColor, borderColor }}>
                {createActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => { setCreateOpen(false); a.action(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-white/5"
                    style={{ color: branding.text_primary || "#f0f0f5" }}
                  >
                    <a.icon className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setUserMenuOpen(!userMenuOpen); }}
              className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-white/5"
            >
              <div
                className="h-7 w-7 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}30` }}
              >
                <span className="text-xs font-semibold" style={{ color: primaryColor }}>{initials}</span>
              </div>
            </button>
            <Dropdown open={userMenuOpen} onClose={() => setUserMenuOpen(false)} className="w-52 rounded-xl border shadow-2xl overflow-hidden" align="right">
              <div style={{ backgroundColor: surfaceColor, borderColor }}>
                <div className="px-3 py-2.5 border-b" style={{ borderColor }}>
                  <p className="text-xs font-medium truncate" style={{ color: branding.text_primary || "#f0f0f5" }}>{userName || "User"}</p>
                  {customerName && <p className="text-[10px] truncate" style={{ color: textSecondary }}>{customerName}</p>}
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); router.push("/platform/settings"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-white/5"
                  style={{ color: branding.text_primary || "#f0f0f5" }}
                >
                  <Settings className="h-3.5 w-3.5" style={{ color: textSecondary }} /> Settings
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); router.push("/platform/billing"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-white/5"
                  style={{ color: branding.text_primary || "#f0f0f5" }}
                >
                  <CreditCard className="h-3.5 w-3.5" style={{ color: textSecondary }} /> Billing
                </button>
                <div className="border-t" style={{ borderColor }}>
                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout?.(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-white/5"
                    style={{ color: "#f43f5e" }}
                  >
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
