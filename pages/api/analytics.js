// pages/api/analytics.js
import { getAuthContext } from "../../lib/supabaseServer";

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function getMonthKey(dateStr) {
  return dateStr.slice(0, 7); // "2026-04"
}

function getGranularity(range) {
  if (range === "7d") return "day";
  if (range === "30d" || range === "90d") return "week";
  return "month"; // "all"
}

function getTimeKey(dateStr, granularity) {
  if (granularity === "day") return dateStr.slice(0, 10);
  if (granularity === "week") return getWeekKey(dateStr);
  return getMonthKey(dateStr);
}

function formatTimeLabel(key, granularity) {
  if (granularity === "day") return key.slice(5); // "04-14"
  if (granularity === "week") {
    const d = new Date(key);
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  }
  // month
  const d = new Date(key + "-01");
  return d.toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
}

function zeroFillTimeSeries(map, sinceDate, untilDate, granularity) {
  const result = [];
  const d = new Date(sinceDate);
  const end = new Date(untilDate);
  const seen = new Set();

  while (d <= end) {
    const key = getTimeKey(d.toISOString(), granularity);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ period: key, label: formatTimeLabel(key, granularity), value: map[key] || 0 });
    }
    // Advance by appropriate increment
    if (granularity === "day") d.setDate(d.getDate() + 1);
    else if (granularity === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  }
  return result;
}

function pctChange(current, previous) {
  if (previous == null || previous === 0) return current > 0 ? null : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, error: authError } = await getAuthContext(req, res);
  // F-016 — gate debug output on NODE_ENV to avoid leaking Supabase error
  // messages and internal user UUIDs to the client in production.
  const isDev = process.env.NODE_ENV !== 'production';
  if (!user) return res.status(401).json({ error: "Not authenticated", ...(isDev && { debug: authError?.message }) });
  if (!customerId) return res.status(403).json({ error: "No customer mapping", ...(isDev && { debug: { userId: user.id } }) });

  const { checkRateLimit } = await import("../../lib/security");
  if (checkRateLimit(req, res, `read:${customerId}`, 120)) return;

  const range = req.query.range || "30d";

  try {
    const now = new Date();
    const granularity = getGranularity(range);

    // Calculate current period boundaries
    let sinceDate = null;
    let periodMs = null;
    if (range === "7d") { periodMs = 7 * 86400000; sinceDate = new Date(now.getTime() - periodMs); }
    else if (range === "30d") { periodMs = 30 * 86400000; sinceDate = new Date(now.getTime() - periodMs); }
    else if (range === "90d") { periodMs = 90 * 86400000; sinceDate = new Date(now.getTime() - periodMs); }
    const sinceIso = sinceDate ? sinceDate.toISOString() : null;

    // Previous period for comparison (e.g., 30d → 30-60 days ago)
    let prevSinceIso = null;
    let prevUntilIso = null;
    if (periodMs) {
      prevUntilIso = sinceDate.toISOString();
      prevSinceIso = new Date(sinceDate.getTime() - periodMs).toISOString();
    }

    // ── CURRENT PERIOD: all queries in parallel ──
    let leadsQ = supabase.from("leads").select("id, source, created_at").eq("customer_id", customerId);
    if (sinceIso) leadsQ = leadsQ.gte("created_at", sinceIso);
    if (range === "all") leadsQ = leadsQ.limit(10000);

    let quotesQ = supabase.from("quotes").select("id, total_ttc").eq("customer_id", customerId).not("status", "eq", "draft");
    if (sinceIso) quotesQ = quotesQ.gte("created_at", sinceIso);

    let contractsQ = supabase.from("contracts").select("id, job_id, signed_at")
      .eq("customer_id", customerId).not("signed_at", "is", null);
    if (sinceIso) contractsQ = contractsQ.gte("signed_at", sinceIso);

    let paymentsQ = supabase.from("payments").select("id, amount, created_at").eq("customer_id", customerId).eq("status", "succeeded");
    if (sinceIso) paymentsQ = paymentsQ.gte("created_at", sinceIso);
    if (range === "all") paymentsQ = paymentsQ.limit(10000);

    // Voice calls — now range-aware
    let voiceQ = supabase.from("messages").select("created_at, message_type")
      .eq("customer_id", customerId).eq("channel", "call");
    if (sinceIso) voiceQ = voiceQ.gte("created_at", sinceIso);

    let missedQ = supabase.from("leads").select("last_missed_call_at")
      .eq("customer_id", customerId).not("last_missed_call_at", "is", null);
    if (sinceIso) missedQ = missedQ.gte("last_missed_call_at", sinceIso);

    // Message volume — now range-aware
    let msgQ = supabase.from("messages").select("created_at, channel")
      .eq("customer_id", customerId);
    if (sinceIso) msgQ = msgQ.gte("created_at", sinceIso);

    // Speed-to-lead: get lead_id + first message times
    let speedQ = supabase.from("messages").select("lead_id, created_at")
      .eq("customer_id", customerId).order("created_at", { ascending: true });
    if (sinceIso) speedQ = speedQ.gte("created_at", sinceIso);

    const currentResults = await Promise.all([
      leadsQ, quotesQ, contractsQ, paymentsQ, voiceQ, missedQ, msgQ, speedQ,
    ]);

    const [
      { data: leadsRows, error: leadsErr },
      { data: quotesRows, error: quotesErr },
      { data: contractRows, error: contractErr },
      { data: paymentsRows, error: paymentsErr },
      { data: voiceRows, error: voiceErr },
      { data: missedRows, error: missedErr },
      { data: msgRows, error: msgErr },
      { data: speedRows, error: speedErr },
    ] = currentResults;

    for (const e of [leadsErr, quotesErr, contractErr, paymentsErr, voiceErr, missedErr, msgErr, speedErr]) {
      if (e) throw e;
    }

    // ── PREVIOUS PERIOD (for comparison) ──
    let prevLeadsCount = null, prevQuotesCount = null, prevContractsCount = null, prevRevenue = null;
    let prevAnswered = null, prevMissed = null;

    if (prevSinceIso && prevUntilIso) {
      const [
        { data: pLeads },
        { data: pQuotes },
        { data: pContracts },
        { data: pPayments },
        { data: pVoice },
        { data: pMissed },
      ] = await Promise.all([
        supabase.from("leads").select("id").eq("customer_id", customerId)
          .gte("created_at", prevSinceIso).lt("created_at", prevUntilIso),
        supabase.from("quotes").select("id").eq("customer_id", customerId)
          .not("status", "eq", "draft")
          .gte("created_at", prevSinceIso).lt("created_at", prevUntilIso),
        supabase.from("contracts").select("id").eq("customer_id", customerId)
          .not("signed_at", "is", null)
          .gte("signed_at", prevSinceIso).lt("signed_at", prevUntilIso),
        supabase.from("payments").select("amount").eq("customer_id", customerId)
          .eq("status", "succeeded")
          .gte("created_at", prevSinceIso).lt("created_at", prevUntilIso),
        supabase.from("messages").select("created_at, message_type").eq("customer_id", customerId)
          .eq("channel", "call")
          .gte("created_at", prevSinceIso).lt("created_at", prevUntilIso),
        supabase.from("leads").select("last_missed_call_at").eq("customer_id", customerId)
          .not("last_missed_call_at", "is", null)
          .gte("last_missed_call_at", prevSinceIso).lt("last_missed_call_at", prevUntilIso),
      ]);

      prevLeadsCount = pLeads?.length || 0;
      prevQuotesCount = pQuotes?.length || 0;
      prevContractsCount = pContracts?.length || 0;
      prevRevenue = (pPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      prevAnswered = (pVoice || []).filter(r => r.message_type === "call_transcript").length;
      prevMissed = (pMissed || []).length;
    }

    // ── 1. Leads (time-series + source breakdown) ──
    const dailyMap = {};
    for (const l of leadsRows || []) {
      const key = getTimeKey(l.created_at || "", granularity);
      if (key) dailyMap[key] = (dailyMap[key] || 0) + 1;
    }

    let leadsPerDay;
    if (range === "all") {
      leadsPerDay = Object.entries(dailyMap)
        .map(([period, count]) => ({ date: period, label: formatTimeLabel(period, granularity), count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const dayCount = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const seriesStart = new Date(now.getTime() - dayCount * 86400000);
      leadsPerDay = zeroFillTimeSeries(dailyMap, seriesStart, now, granularity)
        .map(({ period, label, value }) => ({ date: period, label, count: value }));
    }

    // 1b) Leads by source
    const sourceMap = {};
    for (const l of leadsRows || []) {
      const src = l.source || "unknown";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const leadsBySource = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // ── 2. Conversion funnel (with dollar values) ──
    const totalLeadsCount = (leadsRows || []).length;
    const quotesSentCount = quotesRows?.length || 0;
    const quotesValue = (quotesRows || []).reduce((s, q) => s + Number(q.total_ttc || 0), 0);
    const contractsSigned = contractRows?.length || 0;
    // Contracts don't have amount — estimate from linked quotes via job_id
    const contractJobIds = (contractRows || []).map(c => c.job_id).filter(Boolean);
    let contractsValue = 0;
    if (contractJobIds.length > 0) {
      const { data: contractQuotes } = await supabase.from("quotes")
        .select("total_ttc, job_id").in("job_id", contractJobIds)
        .eq("customer_id", customerId).not("status", "eq", "draft");
      // Take latest quote per job
      const jobQuoteMap = {};
      for (const q of contractQuotes || []) {
        jobQuoteMap[q.job_id] = Number(q.total_ttc || 0);
      }
      contractsValue = Object.values(jobQuoteMap).reduce((s, v) => s + v, 0);
    }
    const paymentsCount = paymentsRows?.length || 0;
    const totalRevenue = (paymentsRows || []).reduce((s, p) => s + Number(p.amount || 0), 0);

    const conversionFunnel = [
      { stage: "Leads", count: totalLeadsCount, value: null },
      { stage: "Quotes Sent", count: quotesSentCount, value: Math.round(quotesValue * 100) / 100 },
      { stage: "Contracts Signed", count: contractsSigned, value: Math.round(contractsValue * 100) / 100 },
      { stage: "Payments", count: paymentsCount, value: Math.round(totalRevenue * 100) / 100 },
    ];

    // ── 3. Revenue per period (respects range) ──
    const revMap = {};
    for (const p of paymentsRows || []) {
      const key = getTimeKey(p.created_at, granularity);
      revMap[key] = (revMap[key] || 0) + Number(p.amount || 0);
    }

    let revenuePerWeek;
    if (range === "all") {
      revenuePerWeek = Object.entries(revMap)
        .map(([period, rev]) => ({ week: formatTimeLabel(period, granularity), weekKey: period, revenue: Math.round(rev) }))
        .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    } else {
      const dayCount = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const seriesStart = new Date(now.getTime() - dayCount * 86400000);
      revenuePerWeek = zeroFillTimeSeries(revMap, seriesStart, now, granularity)
        .map(({ period, label, value }) => ({ week: label, weekKey: period, revenue: Math.round(value) }));
    }

    // ── 4. AI Performance (respects range) ──
    const aiAnsweredMap = {};
    const aiMissedMap = {};
    for (const r of voiceRows || []) {
      if (r.message_type === "call_transcript") {
        const key = getTimeKey(r.created_at, granularity);
        aiAnsweredMap[key] = (aiAnsweredMap[key] || 0) + 1;
      }
    }
    for (const r of missedRows || []) {
      const key = getTimeKey(r.last_missed_call_at, granularity);
      aiMissedMap[key] = (aiMissedMap[key] || 0) + 1;
    }

    const aiPerformance = revenuePerWeek.map(({ week, weekKey }) => ({
      week,
      answered: aiAnsweredMap[weekKey] || 0,
      missed: aiMissedMap[weekKey] || 0,
    }));

    // ── 5. Message volume by channel (respects range) ──
    const msgSmsMap = {};
    const msgCallMap = {};
    const msgEmailMap = {};
    for (const m of msgRows || []) {
      const key = getTimeKey(m.created_at, granularity);
      if (m.channel === "sms") msgSmsMap[key] = (msgSmsMap[key] || 0) + 1;
      if (m.channel === "call") msgCallMap[key] = (msgCallMap[key] || 0) + 1;
      if (m.channel === "email") msgEmailMap[key] = (msgEmailMap[key] || 0) + 1;
    }

    const messageVolume = revenuePerWeek.map(({ week, weekKey }) => ({
      week,
      sms: msgSmsMap[weekKey] || 0,
      call: msgCallMap[weekKey] || 0,
      email: msgEmailMap[weekKey] || 0,
    }));

    // ── 6. Speed-to-lead (avg + median minutes) ──
    let speedToLead = null;
    if (leadsRows?.length > 0 && speedRows?.length > 0) {
      // Build map: lead_id → earliest message time
      const firstMsgMap = {};
      for (const m of speedRows) {
        if (m.lead_id && !firstMsgMap[m.lead_id]) {
          firstMsgMap[m.lead_id] = m.created_at;
        }
      }

      const deltas = [];
      for (const lead of leadsRows) {
        const firstMsg = firstMsgMap[lead.id];
        if (firstMsg) {
          const mins = (new Date(firstMsg) - new Date(lead.created_at)) / 60000;
          if (mins >= 0) deltas.push(mins);
        }
      }

      if (deltas.length > 0) {
        deltas.sort((a, b) => a - b);
        const avg = deltas.reduce((s, v) => s + v, 0) / deltas.length;
        const median = deltas.length % 2 === 0
          ? (deltas[deltas.length / 2 - 1] + deltas[deltas.length / 2]) / 2
          : deltas[Math.floor(deltas.length / 2)];
        speedToLead = {
          avgMinutes: Math.round(avg * 10) / 10,
          medianMinutes: Math.round(median * 10) / 10,
          sampleSize: deltas.length,
        };
      }
    }

    // ── 7. KPI summary with period comparison ──
    const currentAnswered = (voiceRows || []).filter(r => r.message_type === "call_transcript").length;
    const currentMissed = (missedRows || []).length;
    const currentTotal = currentAnswered + currentMissed;
    const currentAiRate = currentTotal > 0 ? Math.round((currentAnswered / currentTotal) * 1000) / 10 : null;

    let prevAiRate = null;
    if (prevAnswered != null && prevMissed != null) {
      const prevTotal = prevAnswered + prevMissed;
      prevAiRate = prevTotal > 0 ? Math.round((prevAnswered / prevTotal) * 1000) / 10 : null;
    }

    const kpis = {
      totalLeads: { current: totalLeadsCount, previous: prevLeadsCount, changePercent: pctChange(totalLeadsCount, prevLeadsCount) },
      totalQuotes: { current: quotesSentCount, previous: prevQuotesCount, changePercent: pctChange(quotesSentCount, prevQuotesCount) },
      totalContracts: { current: contractsSigned, previous: prevContractsCount, changePercent: pctChange(contractsSigned, prevContractsCount) },
      totalRevenue: { current: Math.round(totalRevenue * 100) / 100, previous: prevRevenue != null ? Math.round(prevRevenue * 100) / 100 : null, changePercent: pctChange(totalRevenue, prevRevenue) },
      avgSpeedToLead: { current: speedToLead?.avgMinutes ?? null, previous: null, changePercent: null },
      aiAnswerRate: { current: currentAiRate, previous: prevAiRate, changePercent: pctChange(currentAiRate, prevAiRate) },
    };

    // ── Customer row (for ads + social) ──
    const { data: custRow } = await supabase
      .from("customers").select("fb_ad_account_id, fb_campaign_ids, fb_page_id, fb_page_access_token, fb_pixel_id, ga4_property_id, domain")
      .eq("id", customerId).single();

    // ── 8. Facebook Ads insights (full campaign analysis) ──
    let adsInsights = null;
    const metaToken = process.env.META_SYSTEM_TOKEN;
    if (metaToken) {
      const adAccountId = custRow?.fb_ad_account_id;
      const campaignIds = custRow?.fb_campaign_ids;
      if (adAccountId && campaignIds && campaignIds.length > 0) {
        try {
          const adsSince = sinceIso ? sinceIso.slice(0, 10) : "2020-01-01";
          const adsUntil = now.toISOString().slice(0, 10);
          const timeRange = JSON.stringify({ since: adsSince, until: adsUntil });
          const campaignFilter = JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]);

          // Parallel: daily breakdown + per-campaign breakdown + age/gender breakdown
          const [dailyResp, campaignResp, demoResp] = await Promise.all([
            // Daily time series
            fetch(`https://graph.facebook.com/v21.0/${adAccountId}/insights?` + new URLSearchParams({
              fields: "spend,impressions,clicks,reach,frequency,cpc,cpm,actions,cost_per_action_type",
              time_range: timeRange, time_increment: "1", limit: "100",
              filtering: campaignFilter, access_token: metaToken,
            })),
            // Per-campaign totals
            fetch(`https://graph.facebook.com/v21.0/${adAccountId}/insights?` + new URLSearchParams({
              fields: "campaign_name,campaign_id,spend,impressions,clicks,reach,actions,cost_per_action_type",
              time_range: timeRange, level: "campaign", limit: "20",
              filtering: campaignFilter, access_token: metaToken,
            })),
            // Age + gender breakdown
            fetch(`https://graph.facebook.com/v21.0/${adAccountId}/insights?` + new URLSearchParams({
              fields: "spend,impressions,clicks,actions",
              time_range: timeRange, breakdowns: "age,gender", limit: "50",
              filtering: campaignFilter, access_token: metaToken,
            })),
          ]);

          const [dailyJson, campaignJson, demoJson] = await Promise.all([
            dailyResp.json(), campaignResp.json(), demoResp.json(),
          ]);

          // Process daily data
          let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalLeads = 0, totalReach = 0;
          const dailyData = [];

          for (const day of dailyJson.data || []) {
            const spend = parseFloat(day.spend || 0);
            const impressions = parseInt(day.impressions || 0);
            const clicks = parseInt(day.clicks || 0);
            const reach = parseInt(day.reach || 0);
            totalSpend += spend;
            totalImpressions += impressions;
            totalClicks += clicks;
            totalReach += reach;

            let leads = 0, conversions = 0, pageViews = 0, linkClicks = 0;
            for (const a of day.actions || []) {
              if (a.action_type === "lead") leads += parseInt(a.value || 0);
              if (a.action_type === "landing_page_view") pageViews += parseInt(a.value || 0);
              if (a.action_type === "link_click") linkClicks += parseInt(a.value || 0);
              conversions += parseInt(a.value || 0);
            }
            totalLeads += leads;

            dailyData.push({
              date: day.date_start,
              spend: Math.round(spend * 100) / 100,
              impressions, clicks, reach, leads, pageViews, linkClicks,
            });
          }

          const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads * 100) / 100 : null;
          const ctr = totalImpressions > 0 ? Math.round(totalClicks / totalImpressions * 10000) / 100 : 0;
          const cpc = totalClicks > 0 ? Math.round(totalSpend / totalClicks * 100) / 100 : null;
          const cpm = totalImpressions > 0 ? Math.round(totalSpend / totalImpressions * 100000) / 100 : null;
          const frequency = totalReach > 0 ? Math.round(totalImpressions / totalReach * 10) / 10 : null;

          // Per-campaign breakdown
          const campaigns = (campaignJson.data || []).map(c => {
            let campLeads = 0;
            for (const a of c.actions || []) {
              if (a.action_type === "lead") campLeads += parseInt(a.value || 0);
            }
            return {
              name: c.campaign_name,
              id: c.campaign_id,
              spend: Math.round(parseFloat(c.spend || 0) * 100) / 100,
              impressions: parseInt(c.impressions || 0),
              clicks: parseInt(c.clicks || 0),
              reach: parseInt(c.reach || 0),
              leads: campLeads,
            };
          }).sort((a, b) => b.spend - a.spend);

          // Demographics breakdown
          const demographics = (demoJson.data || []).map(d => {
            let dLeads = 0;
            for (const a of d.actions || []) {
              if (a.action_type === "lead") dLeads += parseInt(a.value || 0);
            }
            return {
              age: d.age,
              gender: d.gender,
              spend: Math.round(parseFloat(d.spend || 0) * 100) / 100,
              impressions: parseInt(d.impressions || 0),
              clicks: parseInt(d.clicks || 0),
              leads: dLeads,
            };
          }).sort((a, b) => b.impressions - a.impressions);

          adsInsights = {
            totalSpend: Math.round(totalSpend * 100) / 100,
            totalImpressions,
            totalClicks,
            totalLeads,
            totalReach,
            cpl, ctr, cpc, cpm, frequency,
            dailyData,
            campaigns,
            demographics,
          };
        } catch (adsErr) {
          console.error("[api/analytics] Facebook Ads fetch error:", adsErr.message);
        }
      }
    }

    // ── 9. Facebook/Instagram Organic Insights (individual metric endpoints) ──
    let socialInsights = null;
    const fbPageToken = custRow?.fb_page_access_token || null;
    const fbPageId = custRow?.fb_page_id || null;
    if (fbPageToken && fbPageId) {
      try {
        const fbSince = sinceIso ? Math.floor(new Date(sinceIso).getTime() / 1000) : Math.floor((now.getTime() - 90 * 86400000) / 1000);
        const fbUntil = Math.floor(now.getTime() / 1000);
        const fbBase = `https://graph.facebook.com/v21.0/${fbPageId}`;

        const metricNames = ["page_views_total", "page_impressions", "page_impressions_unique", "page_engaged_users", "page_post_engagements"];

        const fetchMetric = async (name) => {
          try {
            const r = await fetch(`${fbBase}/insights/${name}/day?since=${fbSince}&until=${fbUntil}&access_token=${fbPageToken}`);
            const j = await r.json();
            if (j.data?.[0]?.values) {
              return { name, values: j.data[0].values.map(v => ({ date: v.end_time?.slice(0, 10), value: v.value || 0 })) };
            }
            return { name, values: [] };
          } catch { return { name, values: [] }; }
        };

        const [m0, m1, m2, m3, m4, fansResp] = await Promise.all([
          ...metricNames.map(fetchMetric),
          fetch(`${fbBase}?fields=followers_count,fan_count,name&access_token=${fbPageToken}`),
        ]);
        const fansJson = await fansResp.json();

        const sumValues = (arr) => arr.reduce((s, v) => s + (v.value || 0), 0);

        // ── Instagram Insights (via linked IG Business Account) ──
        let instagram = null;
        try {
          const igLinkResp = await fetch(`${fbBase}?fields=instagram_business_account&access_token=${fbPageToken}`);
          const igLinkJson = await igLinkResp.json();
          const igId = igLinkJson.instagram_business_account?.id;

          if (igId) {
            const igBase = `https://graph.facebook.com/v21.0/${igId}`;
            const igMetrics = ["reach", "accounts_engaged", "profile_views"];

            const fetchIgMetric = async (name) => {
              try {
                const r = await fetch(`${igBase}/insights?metric=${name}&metric_type=time_series&period=day&since=${fbSince}&until=${fbUntil}&access_token=${fbPageToken}`);
                const j = await r.json();
                if (j.data?.[0]?.values) {
                  return { name, values: j.data[0].values.map(v => ({ date: v.end_time?.slice(0, 10), value: v.value || 0 })) };
                }
                return { name, values: [] };
              } catch { return { name, values: [] }; }
            };

            // Also get totals for KPI cards
            const fetchIgTotal = async (name) => {
              try {
                const r = await fetch(`${igBase}/insights?metric=${name}&metric_type=total_value&period=day&since=${fbSince}&until=${fbUntil}&access_token=${fbPageToken}`);
                const j = await r.json();
                return j.data?.[0]?.total_value?.value || 0;
              } catch { return 0; }
            };

            const [igReach, igEngaged, igProfile, igProfileResp, totalReach, totalEngaged, totalProfileViews] = await Promise.all([
              fetchIgMetric("reach"),
              fetchIgMetric("accounts_engaged"),
              fetchIgMetric("profile_views"),
              fetch(`${igBase}?fields=username,followers_count,media_count,name,profile_picture_url&access_token=${fbPageToken}`),
              fetchIgTotal("reach"),
              fetchIgTotal("accounts_engaged"),
              fetchIgTotal("profile_views"),
            ]);
            const igProfileJson = await igProfileResp.json();

            instagram = {
              username: igProfileJson.username || null,
              name: igProfileJson.name || null,
              followers: igProfileJson.followers_count || 0,
              mediaCount: igProfileJson.media_count || 0,
              profilePic: igProfileJson.profile_picture_url || null,
              reach: igReach.values,
              engagedAccounts: igEngaged.values,
              profileViews: igProfile.values,
              totalReach,
              totalEngaged,
              totalProfileViews,
            };
          }
        } catch (igErr) {
          console.error("[api/analytics] Instagram insights fetch error:", igErr.message);
        }

        socialInsights = {
          pageName: fansJson.name || null,
          followers: fansJson.followers_count || fansJson.fan_count || null,
          pageViews: m0.values,
          impressions: m1.values,
          uniqueReach: m2.values,
          engagedUsers: m3.values,
          postEngagements: m4.values,
          totalPageViews: sumValues(m0.values),
          totalImpressions: sumValues(m1.values),
          totalReach: sumValues(m2.values),
          totalEngaged: sumValues(m3.values),
          totalEngagements: sumValues(m4.values),
          instagram,
        };
      } catch (socialErr) {
        console.error("[api/analytics] Social insights fetch error:", socialErr.message);
      }
    }

    // ── 10. Meta Pixel Website Events (optional) ──
    let pixelInsights = null;
    const fbPixelId = custRow?.fb_pixel_id;
    if (metaToken && fbPixelId) {
      try {
        const pixelSince = sinceIso ? Math.floor(new Date(sinceIso).getTime() / 1000) : Math.floor((now.getTime() - 30 * 86400000) / 1000);
        const pixelUntil = Math.floor(now.getTime() / 1000);

        const statsResp = await fetch(
          `https://graph.facebook.com/v21.0/${fbPixelId}/stats?aggregation=event&start_time=${pixelSince}&end_time=${pixelUntil}&access_token=${metaToken}`
        );
        const statsJson = await statsResp.json();

        if (statsJson.data) {
          // Aggregate events across all time buckets
          const eventMap = {};
          for (const bucket of statsJson.data) {
            for (const evt of bucket.data || []) {
              eventMap[evt.value] = (eventMap[evt.value] || 0) + parseInt(evt.count || 0);
            }
          }
          const events = Object.entries(eventMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

          pixelInsights = {
            events,
            totalEvents: events.reduce((s, e) => s + e.count, 0),
          };
        }
      } catch (pixelErr) {
        console.error("[api/analytics] Pixel stats fetch error:", pixelErr.message);
      }
    }

    // ── 11. GA4 Website Traffic (optional) ──
    let trafficInsights = null;
    const ga4PropId = custRow?.ga4_property_id;
    if (ga4PropId) {
      try {
        const { fetchGA4Traffic } = await import("../../lib/ga4");
        const dayCount = range === "7d" ? 7 : range === "90d" ? 90 : range === "all" ? 365 : 30;
        const trafficStart = new Date(now.getTime() - dayCount * 86400000).toISOString().slice(0, 10);
        const trafficEnd = now.toISOString().slice(0, 10);
        trafficInsights = await fetchGA4Traffic(ga4PropId, trafficStart, trafficEnd);
      } catch (trafficErr) {
        console.error("[api/analytics] GA4 traffic fetch error:", trafficErr.message);
      }
    }

    // ── 12. Devis pipeline metrics (30-day window) ──
    // Conversion rate: signed / sent. Avg deal: median of signed TTC.
    // Cycle time: median days from created_at → signed_at.
    // Margin by month: live projection from quotes.total_ttc − line_items._cost×qty (by month).
    let devisMetrics = null;
    try {
      const since30 = new Date(now.getTime() - 30 * 86400000).toISOString();
      const [{ data: recentJobs }, { data: recentQuotes }] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, status, quote_amount, created_at, signed_at, deposit_paid_at")
          .eq("customer_id", customerId)
          .gte("created_at", since30),
        supabase
          .from("quotes")
          .select("id, job_id, status, subtotal, total_ttc, line_items, created_at")
          .eq("customer_id", customerId)
          .neq("status", "superseded")
          .gte("created_at", since30),
      ]);

      const jobs = recentJobs || [];
      const quotes = recentQuotes || [];

      // conversion: sent_or_beyond = quote.status in ['ready','sent','accepted','signed'] OR job.status past awaiting_client_approval
      const sentStatuses = new Set(["sent", "accepted"]);
      const signedStatuses = new Set(["signed", "contract_signed", "deposit_received", "in_production", "installed", "closed"]);
      const sentCount   = jobs.filter(j => ["awaiting_client_approval","accepted","contract_sent","contract_signed","deposit_received","in_production","installed","closed"].includes(j.status)).length;
      const signedCount = jobs.filter(j => signedStatuses.has(j.status) || j.signed_at).length;
      const conversionRate = sentCount > 0 ? Math.round((signedCount / sentCount) * 100) : 0;

      // Avg deal size (median) of signed jobs' TTC
      const signedJobIds = new Set(jobs.filter(j => signedStatuses.has(j.status) || j.signed_at).map(j => j.id));
      const signedTotals = quotes
        .filter(q => signedJobIds.has(q.job_id))
        .map(q => Number(q.total_ttc || 0))
        .filter(v => v > 0)
        .sort((a, b) => a - b);
      const avgDealSize = signedTotals.length
        ? (signedTotals[Math.floor(signedTotals.length / 2)])
        : 0;

      // Cycle time (days): signed_at - created_at median
      const cycles = jobs
        .filter(j => j.signed_at && j.created_at)
        .map(j => (new Date(j.signed_at) - new Date(j.created_at)) / 86400000)
        .filter(d => d >= 0 && d <= 365)
        .sort((a, b) => a - b);
      const cycleTimeP50 = cycles.length ? Math.round(cycles[Math.floor(cycles.length / 2)]) : 0;

      // Margin by month (last 6 months) — revenue = quote TTC, cost = Σ(_cost × qty)
      const monthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        monthMap[key] = { month: key, revenue: 0, estimatedCost: 0, margin: 0 };
      }
      for (const q of quotes) {
        const key = (q.created_at || '').slice(0, 7);
        if (!monthMap[key]) continue;
        monthMap[key].revenue += Number(q.total_ttc || 0);
        const items = Array.isArray(q.line_items) ? q.line_items : [];
        const cost = items.reduce((s, li) => s + (Number(li._supplier_cost ?? li._cost ?? 0) * (Number(li.qty) || 1)), 0);
        monthMap[key].estimatedCost += cost;
      }
      const marginByMonth = Object.values(monthMap).map(m => ({
        ...m,
        revenue: Math.round(m.revenue * 100) / 100,
        estimatedCost: Math.round(m.estimatedCost * 100) / 100,
        margin: Math.round((m.revenue - m.estimatedCost) * 100) / 100,
      }));

      devisMetrics = {
        window: "30d",
        conversion_rate_pct: conversionRate,
        sent_count: sentCount,
        signed_count: signedCount,
        avg_deal_size: Math.round(avgDealSize * 100) / 100,
        cycle_time_days_p50: cycleTimeP50,
        margin_by_month: marginByMonth,
      };
    } catch (devisErr) {
      console.error("[api/analytics] Devis metrics error:", devisErr?.message);
    }

    const result = {
      kpis,
      leadsPerDay,
      leadsBySource,
      conversionFunnel,
      revenuePerWeek,
      aiPerformance,
      messageVolume,
      speedToLead,
      adsInsights,
      socialInsights,
      pixelInsights,
      trafficInsights,
      devisMetrics,
    };
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/analytics] Error:", err?.message, err?.stack);
    return res.status(500).json({ error: "Internal server error", ...(process.env.NODE_ENV !== 'production' && { debug: err?.message }) });
  }
}
