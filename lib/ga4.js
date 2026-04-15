// lib/ga4.js — GA4 Data API helper using stored OAuth tokens
// Token file: /root/claude-activity-logs/scripts/.ga-token.json

import fs from "fs";
import path from "path";

const TOKEN_PATH = "/root/claude-activity-logs/scripts/.ga-token.json";
const GA4_API = "https://analyticsdata.googleapis.com/v1beta";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  // Return cached if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const raw = fs.readFileSync(TOKEN_PATH, "utf8");
  const tokens = JSON.parse(raw);

  // Refresh the token
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("[ga4] Token refresh failed:", err);
    return null;
  }

  const refreshed = await resp.json();
  cachedToken = refreshed.access_token;
  tokenExpiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;

  // Persist updated access token
  tokens.access_token = cachedToken;
  tokens.expires_in = refreshed.expires_in;
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

  return cachedToken;
}

/**
 * Fetch GA4 traffic data for a property
 * @param {string} propertyId - e.g. "G-V7F3YDV5QR" (will be converted to numeric)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {{ daily: Array, totals: Object } | null}
 */
export async function fetchGA4Traffic(propertyId, startDate, endDate) {
  if (!propertyId) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  // GA4 Data API needs numeric property ID, not measurement ID
  // We need to look up the property by measurement ID
  // First try: use Admin API to find property
  const numericId = await resolvePropertyId(propertyId, accessToken);
  if (!numericId) return null;

  try {
    const resp = await fetch(`${GA4_API}/properties/${numericId}:runReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[ga4] runReport error:", err);
      return null;
    }

    const report = await resp.json();
    const rows = report.rows || [];

    if (rows.length === 0) return null;

    const daily = rows
      .filter((r) => r.dimensionValues?.[0]?.value)
      .map((r) => ({
        date: formatGA4Date(r.dimensionValues[0].value),
        sessions: parseInt(r.metricValues[0].value) || 0,
        users: parseInt(r.metricValues[1].value) || 0,
        pageviews: parseInt(r.metricValues[2].value) || 0,
        bounceRate: Math.round(parseFloat(r.metricValues[3].value || 0) * 1000) / 10,
      }));

    const totals = {
      sessions: daily.reduce((s, d) => s + d.sessions, 0),
      users: daily.reduce((s, d) => s + d.users, 0),
      pageviews: daily.reduce((s, d) => s + d.pageviews, 0),
      bounceRate: daily.length
        ? Math.round(daily.reduce((s, d) => s + d.bounceRate, 0) / daily.length * 10) / 10
        : 0,
    };

    return { daily, totals };
  } catch (err) {
    console.error("[ga4] fetchGA4Traffic error:", err.message);
    return null;
  }
}

// Cache measurement ID → numeric property ID mapping
const propertyIdCache = {};

async function resolvePropertyId(measurementId, accessToken) {
  if (propertyIdCache[measurementId]) return propertyIdCache[measurementId];

  try {
    // Use GA4 Admin API to list account summaries and find the property
    const resp = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=100",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!resp.ok) {
      console.error("[ga4] Admin API error:", await resp.text());
      return null;
    }

    const data = await resp.json();
    for (const account of data.accountSummaries || []) {
      for (const prop of account.propertySummaries || []) {
        // prop.property = "properties/123456"
        // We need to check if this property has our measurement ID
        const propId = prop.property.replace("properties/", "");

        // Check data streams for this property to find measurement ID
        const dsResp = await fetch(
          `https://analyticsadmin.googleapis.com/v1beta/properties/${propId}/dataStreams`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (dsResp.ok) {
          const dsData = await dsResp.json();
          for (const ds of dsData.dataStreams || []) {
            if (ds.webStreamData?.measurementId === measurementId) {
              propertyIdCache[measurementId] = propId;
              return propId;
            }
          }
        }
      }
    }

    console.error("[ga4] Could not find property for measurement ID:", measurementId);
    return null;
  } catch (err) {
    console.error("[ga4] resolvePropertyId error:", err.message);
    return null;
  }
}

function formatGA4Date(dateStr) {
  // GA4 returns "20260415" format → "2026-04-15"
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}
