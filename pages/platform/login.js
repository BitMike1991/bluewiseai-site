// pages/platform/login.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PlatformLogin() {
  const router = useRouter();

  const nextPath = useMemo(() => {
    const n = typeof router.query.next === "string" ? router.query.next : null;
    return n && n.startsWith("/platform/") ? n : "/platform/overview";
  }, [router.query.next]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // If we arrived here with ?next=, middleware already rejected us.
      // The client-side session is stale — clear it to break the loop.
      const hasNext = new URLSearchParams(window.location.search).has("next");
      if (hasNext) {
        await supabase.auth.signOut();
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data?.session) window.location.href = nextPath;
    })();
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (!email) throw new Error("Email is required.");

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}${nextPath}` },
        });
        if (error) throw error;
        setMsg("Magic link sent. Check your email.");
        return;
      }

      // 1) Client login (gets access + refresh tokens)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const session = data?.session;
      if (!session?.access_token || !session?.refresh_token) {
        throw new Error("No session returned from Supabase.");
      }

      // 2) Send tokens to server so it can set HttpOnly cookies (middleware reads these)
      const resp = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to establish session cookies.");
      }

      // 3) IMPORTANT: force full page load so middleware runs and sees cookies
      window.location.href = nextPath;
    } catch (err) {
      setMsg(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(0,200,255,0.12)] p-6">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">
            BlueWise Platform
          </div>
          <div className="text-sm text-white/70 mt-1">
            Sign in to access your dashboard.
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={cx(
              "flex-1 rounded-xl px-3 py-2 text-sm border",
              mode === "password"
                ? "border-cyan-400/40 bg-cyan-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={cx(
              "flex-1 rounded-xl px-3 py-2 text-sm border",
              mode === "magic"
                ? "border-cyan-400/40 bg-cyan-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-white/70 mb-1">Email</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          {mode === "password" && (
            <div>
              <label className="block text-xs text-white/70 mb-1">
                Password
              </label>
              <input
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400/15 border border-cyan-400/30 hover:bg-cyan-400/20 px-3 py-2 text-sm font-medium disabled:opacity-60"
            type="submit"
          >
            {loading
              ? "Signing in..."
              : mode === "magic"
              ? "Send magic link"
              : "Sign in"}
          </button>

          {msg && (
            <div className="text-sm text-white/80 rounded-xl border border-white/10 bg-white/5 p-3">
              {msg}
            </div>
          )}
        </form>

        <div className="mt-5 text-xs text-white/50">
          If you don't have credentials yet, you'll need an invite (we'll automate
          this in onboarding).
        </div>
      </div>
    </div>
  );
}
