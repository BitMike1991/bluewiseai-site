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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, error: authError } = await getAuthContext(req, res);
  console.log("[analytics] auth:", { userId: user?.id, customerId, authError: authError?.message });
  if (!user) return res.status(401).json({ error: "Not authenticated", debug: authError?.message });
  if (!customerId) return res.status(403).json({ error: "No customer mapping", debug: { userId: user.id } });

  const { checkRateLimit } = await import("../../lib/security");
  if (checkRateLimit(req, res, `read:${customerId}`, 120)) return;

  const range = req.query.range || "30d";

  try {
    const now = new Date();
    let sinceDate = null;
    if (range === "7d") sinceDate = new Date(now.getTime() - 7 * 86400000);
    else if (range === "30d") sinceDate = new Date(now.getTime() - 30 * 86400000);
    else if (range === "90d") sinceDate = new Date(now.getTime() - 90 * 86400000);
    const sinceIso = sinceDate ? sinceDate.toISOString() : null;

    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 86400000).toISOString();

    // ── 1. Leads (time-series + source breakdown) ──
    let leadsQ = supabase.from("leads").select("id, source, created_at").eq("customer_id", customerId);
    if (sinceIso) leadsQ = leadsQ.gte("created_at", sinceIso);
    const { data: leadsRows, error: leadsErr } = await leadsQ;
    if (leadsErr) throw leadsErr;

    // 1a) Leads per day — zero-filled
    const dailyMap = {};
    for (const l of leadsRows || []) {
      const day = (l.created_at || "").slice(0, 10);
      if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
    }

    let leadsPerDay;
    if (range === "all") {
      leadsPerDay = Object.entries(dailyMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const dayCount = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      leadsPerDay = [];
      for (let i = dayCount - 1; i >= 0; i--) {
        const key = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
        leadsPerDay.push({ date: key, count: dailyMap[key] || 0 });
      }
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

    // ── 2. Conversion funnel ──
    const totalLeadsCount = (leadsRows || []).length;

    let quotesQ = supabase.from("quotes").select("id").eq("customer_id", customerId).not("status", "eq", "draft");
    if (sinceIso) quotesQ = quotesQ.gte("created_at", sinceIso);
    const { data: quotesRows, error: quotesErr } = await quotesQ;
    if (quotesErr) throw quotesErr;
    const quotesSentCount = quotesRows?.length || 0;

    // contracts has customer_id
    let contractsQ = supabase.from("contracts").select("id")
      .eq("customer_id", customerId).not("signed_at", "is", null);
    if (sinceIso) contractsQ = contractsQ.gte("signed_at", sinceIso);
    const { data: contractRows, error: contractErr } = await contractsQ;
    if (contractErr) throw contractErr;
    const contractsSigned = contractRows?.length || 0;

    let paymentsQ = supabase.from("payments").select("id").eq("customer_id", customerId).eq("status", "succeeded");
    if (sinceIso) paymentsQ = paymentsQ.gte("created_at", sinceIso);
    const { data: paymentsRows, error: paymentsErr } = await paymentsQ;
    if (paymentsErr) throw paymentsErr;

    const conversionFunnel = [
      { stage: "Leads", count: totalLeadsCount },
      { stage: "Quotes Sent", count: quotesSentCount },
      { stage: "Contracts Signed", count: contractsSigned },
      { stage: "Payments", count: paymentsRows?.length || 0 },
    ];

    // ── 3. Revenue per week (12 weeks) ──
    const { data: revenueRows, error: revenueErr } = await supabase
      .from("payments").select("amount, created_at")
      .eq("customer_id", customerId).eq("status", "succeeded")
      .gte("created_at", twelveWeeksAgo);
    if (revenueErr) throw revenueErr;

    const weekRevMap = {};
    for (const p of revenueRows || []) {
      const wk = getWeekKey(p.created_at);
      weekRevMap[wk] = (weekRevMap[wk] || 0) + Number(p.amount || 0);
    }

    const revenuePerWeek = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      const key = getWeekKey(d.toISOString());
      const label = new Date(key).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
      revenuePerWeek.push({ week: label, weekKey: key, revenue: Math.round(weekRevMap[key] || 0) });
    }

    // ── 4. AI Performance (12 weeks) ──
    const { data: voiceRows, error: voiceErr } = await supabase
      .from("messages").select("created_at, message_type")
      .eq("customer_id", customerId).eq("channel", "call")
      .gte("created_at", twelveWeeksAgo);
    if (voiceErr) throw voiceErr;

    const { data: missedRows, error: missedErr } = await supabase
      .from("leads").select("last_missed_call_at")
      .eq("customer_id", customerId)
      .not("last_missed_call_at", "is", null)
      .gte("last_missed_call_at", twelveWeeksAgo);
    if (missedErr) throw missedErr;

    const aiAnsweredMap = {};
    const aiMissedMap = {};
    for (const r of voiceRows || []) {
      if (r.message_type === "call_transcript") {
        const wk = getWeekKey(r.created_at);
        aiAnsweredMap[wk] = (aiAnsweredMap[wk] || 0) + 1;
      }
    }
    for (const r of missedRows || []) {
      const wk = getWeekKey(r.last_missed_call_at);
      aiMissedMap[wk] = (aiMissedMap[wk] || 0) + 1;
    }

    const aiPerformance = revenuePerWeek.map(({ week, weekKey }) => ({
      week,
      answered: aiAnsweredMap[weekKey] || 0,
      missed: aiMissedMap[weekKey] || 0,
    }));

    // ── 5. Message volume by channel (12 weeks) ──
    const { data: msgRows, error: msgErr } = await supabase
      .from("messages").select("created_at, channel")
      .eq("customer_id", customerId)
      .gte("created_at", twelveWeeksAgo);
    if (msgErr) throw msgErr;

    const msgSmsMap = {};
    const msgCallMap = {};
    const msgEmailMap = {};
    for (const m of msgRows || []) {
      const wk = getWeekKey(m.created_at);
      if (m.channel === "sms") msgSmsMap[wk] = (msgSmsMap[wk] || 0) + 1;
      if (m.channel === "call") msgCallMap[wk] = (msgCallMap[wk] || 0) + 1;
      if (m.channel === "email") msgEmailMap[wk] = (msgEmailMap[wk] || 0) + 1;
    }

    const messageVolume = revenuePerWeek.map(({ week, weekKey }) => ({
      week,
      sms: msgSmsMap[weekKey] || 0,
      call: msgCallMap[weekKey] || 0,
      email: msgEmailMap[weekKey] || 0,
    }));

    const result = {
      leadsPerDay,
      leadsBySource,
      conversionFunnel,
      revenuePerWeek,
      aiPerformance,
      messageVolume,
    };
    console.log("[analytics] success:", { customerId, leads: leadsPerDay.length, sources: leadsBySource.length, funnel: conversionFunnel.length });
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/analytics] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
