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
  if (!user) return res.status(401).json({ error: "Not authenticated", debug: authError?.message });
  if (!customerId) return res.status(403).json({ error: "No customer mapping", debug: { userId: user.id } });

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
      .from("customers").select("fb_ad_account_id, fb_campaign_ids, fb_page_id, fb_page_access_token, domain")
      .eq("id", customerId).single();

    // ── 8. Facebook Ads insights (optional) ──
    let adsInsights = null;
    const metaToken = process.env.META_SYSTEM_TOKEN;
    if (metaToken) {
      const adAccountId = custRow?.fb_ad_account_id;
      const campaignIds = custRow?.fb_campaign_ids;
      if (adAccountId && campaignIds && campaignIds.length > 0) {
        try {
          const adsSince = sinceIso ? sinceIso.slice(0, 10) : "2020-01-01";
          const adsUntil = now.toISOString().slice(0, 10);
          const insightsParams = new URLSearchParams({
            fields: "spend,impressions,clicks,cpc,cpm,actions,cost_per_action_type",
            time_range: JSON.stringify({ since: adsSince, until: adsUntil }),
            time_increment: "1",
            limit: "100",
            filtering: JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]),
            access_token: metaToken,
          });
          const adsResp = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/insights?${insightsParams}`);
          const adsJson = await adsResp.json();

          if (adsJson.data && adsJson.data.length > 0) {
            let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalLeads = 0;
            const dailySpend = [];

            for (const day of adsJson.data) {
              const spend = parseFloat(day.spend || 0);
              const impressions = parseInt(day.impressions || 0);
              const clicks = parseInt(day.clicks || 0);
              totalSpend += spend;
              totalImpressions += impressions;
              totalClicks += clicks;

              let leads = 0;
              if (day.actions) {
                const leadAction = day.actions.find(a => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped");
                if (leadAction) leads = parseInt(leadAction.value || 0);
              }
              totalLeads += leads;

              dailySpend.push({
                date: day.date_start,
                spend: Math.round(spend * 100) / 100,
                impressions,
                clicks,
                leads,
              });
            }

            const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads * 100) / 100 : null;
            const ctr = totalImpressions > 0 ? Math.round(totalClicks / totalImpressions * 10000) / 100 : 0;
            const cpc = totalClicks > 0 ? Math.round(totalSpend / totalClicks * 100) / 100 : null;

            adsInsights = {
              totalSpend: Math.round(totalSpend * 100) / 100,
              totalImpressions,
              totalClicks,
              totalLeads,
              cpl,
              ctr,
              cpc,
              dailySpend,
            };
          }
        } catch (adsErr) {
          console.error("[api/analytics] Facebook Ads fetch error:", adsErr.message);
        }
      }
    }

    // ── 9. Facebook/Instagram Organic Insights (optional) ──
    let socialInsights = null;
    const fbPageToken = custRow?.fb_page_access_token || null;
    const fbPageId = custRow?.fb_page_id || null;
    if (fbPageToken && fbPageId) {
      try {
        const fbSince = sinceIso ? Math.floor(new Date(sinceIso).getTime() / 1000) : Math.floor((now.getTime() - 90 * 86400000) / 1000);
        const fbUntil = Math.floor(now.getTime() / 1000);

        const [pageInsightsResp, pageFansResp] = await Promise.all([
          fetch(`https://graph.facebook.com/v21.0/${fbPageId}/insights?metric=page_impressions,page_engaged_users,page_post_engagements&period=day&since=${fbSince}&until=${fbUntil}&access_token=${fbPageToken}`),
          fetch(`https://graph.facebook.com/v21.0/${fbPageId}?fields=followers_count,fan_count,name&access_token=${fbPageToken}`),
        ]);

        const [insightsJson, fansJson] = await Promise.all([pageInsightsResp.json(), pageFansResp.json()]);

        const metrics = {};
        if (insightsJson.data) {
          for (const metric of insightsJson.data) {
            const values = (metric.values || []).map(v => ({
              date: v.end_time?.slice(0, 10),
              value: v.value || 0,
            }));
            metrics[metric.name] = values;
          }
        }

        socialInsights = {
          pageName: fansJson.name || null,
          followers: fansJson.followers_count || fansJson.fan_count || null,
          impressions: metrics.page_impressions || [],
          engagedUsers: metrics.page_engaged_users || [],
          postEngagements: metrics.page_post_engagements || [],
        };
      } catch (socialErr) {
        console.error("[api/analytics] Social insights fetch error:", socialErr.message);
      }
    }

    // ── 10. Vercel Web Analytics (optional) ──
    let webTraffic = null;
    const vercelToken = process.env.VERCEL_ANALYTICS_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    // Per-customer: check customers.domain to get their Vercel project
    // For now, show platform-level analytics if token is set
    if (vercelToken && vercelProjectId) {
      try {
        const vSince = sinceIso ? new Date(sinceIso).getTime() : now.getTime() - 30 * 86400000;
        const vUntil = now.getTime();

        const [pvResp, refResp] = await Promise.all([
          fetch(`https://vercel.com/api/web/insights/stats/path?projectId=${vercelProjectId}&from=${vSince}&to=${vUntil}&limit=10`, {
            headers: { Authorization: `Bearer ${vercelToken}` },
          }),
          fetch(`https://vercel.com/api/web/insights/stats/referrer?projectId=${vercelProjectId}&from=${vSince}&to=${vUntil}&limit=10`, {
            headers: { Authorization: `Bearer ${vercelToken}` },
          }),
        ]);

        const [pvJson, refJson] = await Promise.all([pvResp.json(), refResp.json()]);

        webTraffic = {
          topPages: pvJson.data || [],
          topReferrers: refJson.data || [],
        };
      } catch (webErr) {
        console.error("[api/analytics] Vercel Analytics fetch error:", webErr.message);
      }
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
      webTraffic,
    };
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/analytics] Error:", err?.message, err?.stack);
    return res.status(500).json({ error: "Internal server error", debug: err?.message });
  }
}
