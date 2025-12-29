// src/components/dashboard/DashboardLayout.js
import { useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { supabase } from "../../../lib/supabaseClient";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav onLogout={handleLogout} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">{children}</main>
      </div>
    </div>
  );
}
