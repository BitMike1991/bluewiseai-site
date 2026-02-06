// src/components/dashboard/DashboardLayout.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { supabase } from "../../../lib/supabaseClient";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: null, customerName: null });

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

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/platform/login");
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
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
