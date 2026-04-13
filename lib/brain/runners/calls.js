// lib/brain/runners/calls.js
// Call tools for Brain v2
// Uses call_scores table (no call_logs table exists)

export async function runListCallsTool(supabase, customerId, args) {
  const { date_from, date_to, lead_name, limit } = args || {};
  const max = Math.min(Math.max(Number(limit) || 25, 1), 100);

  let q = supabase
    .from("call_scores")
    .select(
      "id, call_id, customer_id, agent_id, scored_at, duration_ms, user_sentiment, call_successful, disconnection_reason, lead_name, call_outcome, urgency_level, meeting_booked, callback_requested, quote_requested, total_score, quality_score, created_at"
    )
    .eq("customer_id", customerId);

  if (date_from) {
    q = q.gte("created_at", new Date(date_from).toISOString());
  }

  if (date_to) {
    const to = new Date(date_to);
    to.setHours(23, 59, 59, 999);
    q = q.lte("created_at", to.toISOString());
  }

  if (lead_name) {
    q = q.ilike("lead_name", `%${lead_name}%`);
  }

  q = q.order("created_at", { ascending: false }).limit(max);

  const { data: rows, error } = await q;

  if (error) {
    console.error("[brain/calls] list_calls error:", error);
    throw new Error("Failed to fetch call records.");
  }

  const items = (rows || []).map((r) => ({
    id: r.id,
    callId: r.call_id,
    agentId: r.agent_id || null,
    scoredAt: r.scored_at || null,
    durationMs: r.duration_ms || null,
    durationFormatted: r.duration_ms
      ? `${Math.floor(r.duration_ms / 60000)}m ${Math.floor(
          (r.duration_ms % 60000) / 1000
        )}s`
      : null,
    userSentiment: r.user_sentiment || null,
    callSuccessful: r.call_successful,
    disconnectionReason: r.disconnection_reason || null,
    leadName: r.lead_name || null,
    callOutcome: r.call_outcome || null,
    urgencyLevel: r.urgency_level || null,
    meetingBooked: r.meeting_booked || false,
    callbackRequested: r.callback_requested || false,
    quoteRequested: r.quote_requested || false,
    totalScore: r.total_score || null,
    qualityScore: r.quality_score || null,
    createdAt: r.created_at,
  }));

  return {
    intent: "list_calls",
    resultType: "call_list",
    title: "Call history",
    items,
    aiSummary:
      items.length === 0
        ? "No call records found."
        : `Found ${items.length} call(s). ${
            items.filter((c) => c.callSuccessful).length
          } successful.`,
  };
}

export async function runGetCallTranscriptTool(supabase, customerId, args) {
  const { call_id } = args || {};

  if (!call_id) {
    throw new Error("call_id is required.");
  }

  const { data, error } = await supabase
    .from("call_scores")
    .select(
      "id, call_id, customer_id, agent_id, scored_at, duration_ms, user_sentiment, call_successful, disconnection_reason, lead_name, call_outcome, urgency_level, meeting_booked, callback_requested, quote_requested, resolution_score, speed_score, quality_score, total_score, first_word_ms, avg_response_ms, tool_calls_count, transcript, analysis_raw, created_at"
    )
    .eq("customer_id", customerId)
    .eq("call_id", call_id)
    .maybeSingle();

  if (error) {
    console.error("[brain/calls] get_call_transcript error:", error);
    throw new Error("Failed to fetch call transcript.");
  }

  if (!data) {
    throw new Error(`Call "${call_id}" not found.`);
  }

  const item = {
    id: data.id,
    callId: data.call_id,
    agentId: data.agent_id || null,
    scoredAt: data.scored_at || null,
    durationMs: data.duration_ms || null,
    durationFormatted: data.duration_ms
      ? `${Math.floor(data.duration_ms / 60000)}m ${Math.floor(
          (data.duration_ms % 60000) / 1000
        )}s`
      : null,
    userSentiment: data.user_sentiment || null,
    callSuccessful: data.call_successful,
    disconnectionReason: data.disconnection_reason || null,
    leadName: data.lead_name || null,
    callOutcome: data.call_outcome || null,
    urgencyLevel: data.urgency_level || null,
    meetingBooked: data.meeting_booked || false,
    callbackRequested: data.callback_requested || false,
    quoteRequested: data.quote_requested || false,
    scores: {
      resolution: data.resolution_score || null,
      speed: data.speed_score || null,
      quality: data.quality_score || null,
      total: data.total_score || null,
    },
    performance: {
      firstWordMs: data.first_word_ms || null,
      avgResponseMs: data.avg_response_ms || null,
      toolCallsCount: data.tool_calls_count || null,
    },
    transcript: data.transcript || null,
    analysisRaw: data.analysis_raw || null,
    createdAt: data.created_at,
  };

  return {
    intent: "get_call_transcript",
    resultType: "call_detail",
    title: `Call ${data.call_id}`,
    items: [item],
    aiSummary: `Call with ${data.lead_name || "unknown"} — ${
      data.call_successful ? "successful" : "unsuccessful"
    } — outcome: ${data.call_outcome || "unknown"} — score: ${
      data.total_score || "N/A"
    }/100`,
  };
}
