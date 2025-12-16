// src/components/dashboard/DashboardLayout.js
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { supabase } from "../../../lib/supabaseClient";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      // Middleware will also protect, but we proactively route
      router.push("/platform/login");
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1">
        <TopNav onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
