// src/components/dashboard/DashboardLayout.js
// PHASE 2 (not implemented): Custom subdomain routing
// Vercel wildcard domain *.bluewiseai.com → Next.js middleware reads hostname
// → looks up customer by domain column → sets customer context before render
// → DashboardLayout picks up branding from that customer
// Current implementation: auth-based branding via BrandingProvider (Prompts 1-4)
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import SuspendedScreen from "./SuspendedScreen";
import { BrandingProvider, useBranding } from "./BrandingContext";
import { supabase } from "../../../lib/supabaseClient";

function hexToRgb(hex) {
  const h = (hex || '#6c63ff').replace('#', '');
  return `${parseInt(h.slice(0,2),16)} ${parseInt(h.slice(2,4),16)} ${parseInt(h.slice(4,6),16)}`;
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: null, customerName: null });
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || null;
          const meta = session.user.user_metadata || {};
          const customerName = meta.customer_name || meta.company || null;
          setUserInfo({ email, customerName });
        }
      } catch (e) {
        // silent - non-critical
      }
    }
    loadUser();
  }, []);

  // Subscription gate check
  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/subscription/status");
        if (res.ok) {
          const data = await res.json();
          if (data.allowed === false) setSuspended(true);
        }
        // Fail-open: any error = allow access
      } catch (e) {
        // Fail-open
      }
    }
    checkSubscription();
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      // Middleware will also protect, but we proactively route
      router.push("/platform/login");
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // If suspended, show blocked screen instead of CRM
  if (suspended) return <SuspendedScreen />;

  return (
    <BrandingProvider>
      <DashboardShell
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
        toggleSidebar={toggleSidebar}
        handleLogout={handleLogout}
        userInfo={userInfo}
      >
        {children}
      </DashboardShell>
    </BrandingProvider>
  );
}

function DashboardShell({ sidebarOpen, closeSidebar, toggleSidebar, handleLogout, userInfo, children }) {
  const { branding } = useBranding();

  return (
    <div
      className="flex h-screen"
      style={{
        backgroundColor: branding.dashboard_bg || "#0a0a12",
        color: branding.text_primary || "#f0f0f5",
        '--d-bg': branding.dashboard_bg || '#0a0a12',
        '--d-bg-rgb': hexToRgb(branding.dashboard_bg || '#0a0a12'),
        '--d-surface': branding.surface_color || '#111119',
        '--d-surface-rgb': hexToRgb(branding.surface_color || '#111119'),
        '--d-border': branding.border_color || '#1e1e2e',
        '--d-border-rgb': hexToRgb(branding.border_color || '#1e1e2e'),
        '--d-text': branding.text_primary || '#f0f0f5',
        '--d-text-rgb': hexToRgb(branding.text_primary || '#f0f0f5'),
        '--d-muted': branding.text_secondary || '#8888aa',
        '--d-muted-rgb': hexToRgb(branding.text_secondary || '#8888aa'),
        '--d-primary': branding.primary_color || '#6c63ff',
        '--d-primary-rgb': hexToRgb(branding.primary_color || '#6c63ff'),
        '--d-accent': branding.accent_color || '#00d4aa',
        '--d-accent-rgb': hexToRgb(branding.accent_color || '#00d4aa'),
      }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        customerName={userInfo.customerName}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
          userName={userInfo.email}
          customerName={userInfo.customerName}
        />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">{children}</main>
      </div>
    </div>
  );
}
