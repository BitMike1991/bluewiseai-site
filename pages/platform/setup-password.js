// pages/platform/setup-password.js
// First-time password setup for invited users

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function SetupPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Check if user is logged in
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in, redirect to login
        window.location.href = "/platform/login";
        return;
      }

      if (user.confirmed_at) {
        // Already confirmed, go to dashboard
        window.location.href = "/platform/overview";
        return;
      }

      setUserEmail(user.email || "");
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Password set successfully - redirect to dashboard
      setTimeout(() => {
        window.location.href = "/platform/overview";
      }, 1000);

    } catch (err) {
      setError(err?.message || "Failed to set password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(0,200,255,0.12)] p-8">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">
            Set Your Password
          </div>
          <div className="text-sm text-white/70 mt-2">
            Welcome to BlueWise! Create a password to secure your account.
          </div>
          {userEmail && (
            <div className="text-xs text-cyan-400/70 mt-2">
              {userEmail}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">
              Password
            </label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">
              Confirm Password
            </label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/40"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 rounded-xl border border-red-400/30 bg-red-400/10 p-3">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400/15 border border-cyan-400/30 hover:bg-cyan-400/20 px-4 py-2.5 text-sm font-medium disabled:opacity-60 transition-colors"
            type="submit"
          >
            {loading ? "Setting password..." : "Continue to Dashboard"}
          </button>
        </form>

        <div className="mt-6 text-xs text-white/50 text-center">
          You'll use this password to log in to your dashboard.
        </div>
      </div>
    </div>
  );
}
