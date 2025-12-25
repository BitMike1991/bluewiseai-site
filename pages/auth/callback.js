// pages/auth/callback.js
// Handles Supabase auth callbacks (magic links, invites, password resets, etc.)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for router to be ready with query params
    if (!router.isReady) return;

    handleAuthCallback();
  }, [router.isReady]);

  async function handleAuthCallback() {
    try {
      const { token_hash, type, next } = router.query;

      // Check if we already have a session (invite flow - Supabase verified token server-side)
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session) {
        // Session already exists from invite/email confirmation flow
        setStatus("creating_session");
        const session = sessionData.session;

        // Set HttpOnly cookies via our API endpoint
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
          throw new Error(payload?.error || "Failed to set session cookies");
        }

        setStatus("success");

        // Determine where to redirect
        let redirectTo = "/platform/overview";

        // Use next param if provided and valid
        if (next && typeof next === "string" && next.startsWith("/platform/")) {
          redirectTo = next;
        }

        // Full page navigation to ensure middleware runs
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);

      } else if (token_hash && type) {
        // Magic link flow - verify the OTP token
        setStatus("verifying");

        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type,
        });

        if (verifyError) throw verifyError;

        const session = data?.session;
        if (!session?.access_token || !session?.refresh_token) {
          throw new Error("No valid session returned from token verification");
        }

        setStatus("creating_session");

        // Set HttpOnly cookies via our API endpoint
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
          throw new Error(payload?.error || "Failed to set session cookies");
        }

        setStatus("success");

        // Determine where to redirect
        let redirectTo = "/platform/overview";

        // Use next param if provided and valid
        if (next && typeof next === "string" && next.startsWith("/platform/")) {
          redirectTo = next;
        }

        // Full page navigation to ensure middleware runs
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);

      } else {
        throw new Error("No session found and no authentication parameters provided");
      }

    } catch (err) {
      console.error("Auth callback error:", err);
      setError(err?.message || "Authentication failed");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(0,200,255,0.12)] p-8 text-center">
        {status === "processing" && (
          <>
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing...</h2>
            <p className="text-white/60 text-sm">
              Please wait while we verify your authentication link.
            </p>
          </>
        )}

        {status === "verifying" && (
          <>
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying</h2>
            <p className="text-white/60 text-sm">
              Confirming your identity...
            </p>
          </>
        )}

        {status === "creating_session" && (
          <>
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Setting up session</h2>
            <p className="text-white/60 text-sm">
              Preparing your dashboard...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-white/60 text-sm">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-white/60 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push("/platform/login")}
              className="w-full rounded-xl bg-cyan-400/15 border border-cyan-400/30 hover:bg-cyan-400/20 px-4 py-2 text-sm font-medium"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
