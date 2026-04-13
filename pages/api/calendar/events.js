// pages/api/calendar/events.js — Fetch Google Calendar events
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { decryptToken as decrypt } from "../../../lib/tokenEncryption";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: "start and end query params required (ISO dates)" });
  }

  try {
    // Get OAuth token — service role required (RLS blocks session client)
    const sbAdmin = getSupabaseServerClient();
    const { data: oauthRow, error: oauthErr } = await sbAdmin
      .from("customer_email_oauth")
      .select("access_token, refresh_token, token_expiry")
      .eq("customer_id", customerId)
      .eq("provider", "gmail")
      .eq("status", "active")
      .maybeSingle();

    if (oauthErr || !oauthRow) {
      return res.status(200).json({ events: [], connected: false, error: "no_oauth", detail: oauthErr?.message || "no gmail oauth row for this customer", _debug: { customerId, cookie: req.cookies?.["__active_tenant"] || "NONE" } });
    }

    let accessToken;
    const now = Date.now();
    const expiry = oauthRow.token_expiry ? new Date(oauthRow.token_expiry).getTime() : 0;

    if (expiry > now + 300000) {
      // Token still valid (5 min buffer)
      accessToken = decrypt(oauthRow.access_token);
    } else {
      // Refresh token
      const refreshToken = decrypt(oauthRow.refresh_token);
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("[calendar/events] token refresh failed:", tokenData);
        return res.status(200).json({ events: [], connected: false, error: "token_refresh_failed", detail: tokenData.error || tokenData.error_description || "unknown" });
      }
      accessToken = tokenData.access_token;
    }

    // Fetch events from Google Calendar
    const calUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calUrl.searchParams.set("timeMin", new Date(start).toISOString());
    calUrl.searchParams.set("timeMax", new Date(end).toISOString());
    calUrl.searchParams.set("singleEvents", "true");
    calUrl.searchParams.set("orderBy", "startTime");
    calUrl.searchParams.set("maxResults", "200");

    const calRes = await fetch(calUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!calRes.ok) {
      const calErr = await calRes.json().catch(() => ({}));
      console.error("[calendar/events] Google Calendar error:", calErr);
      return res.status(200).json({ events: [], connected: true, error: "Calendar API error" });
    }

    const calData = await calRes.json();
    const events = (calData.items || []).map((e) => ({
      id: e.id,
      title: e.summary || "(No title)",
      description: e.description || null,
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      allDay: !e.start?.dateTime,
      location: e.location || null,
      status: e.status,
      htmlLink: e.htmlLink,
    }));

    return res.status(200).json({ events, connected: true });
  } catch (err) {
    console.error("[calendar/events] error:", err);
    return res.status(500).json({ error: "Failed to fetch calendar events" });
  }
}
