// pages/api/calls/index.js

import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { supabase, customerId, user } = await getAuthContext(req, res);

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!customerId) {
      return res.status(403).json({ error: "No customer mapping for this user" });
    }

    // Pagination
    const page = Number.parseInt(req.query.page ?? "1", 10) || 1;
    const pageSize = Number.parseInt(req.query.pageSize ?? "25", 10) || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const outcomeFilter = req.query.outcome ?? "all";

    // 1) Fetch raw Telnyx events
    // Prefer tenant-scoped fetch if telnyx_other_events has customer_id; fallback to original query if not.
    let data = null;
    let count = null;

    {
      const q = supabase
        .from("telnyx_other_events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      // Try applying tenant filter; if the column doesn't exist in this table, retry without it.
      const { data: d1, error: e1, count: c1 } = await q.eq("customer_id", customerId);

      if (e1) {
        const msg = (e1.message || "").toLowerCase();
        const looksLikeMissingColumn =
          msg.includes("column") && msg.includes("customer_id") && msg.includes("does not exist");

        if (!looksLikeMissingColumn) {
          console.error("[/api/calls] Supabase telnyx_other_events error:", e1);
          return res.status(500).json({ error: e1.message });
        }

        const { data: d2, error: e2, count: c2 } = await supabase
          .from("telnyx_other_events")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        if (e2) {
          console.error("[/api/calls] Supabase telnyx_other_events error:", e2);
          return res.status(500).json({ error: e2.message });
        }

        data = d2;
        count = c2;
      } else {
        data = d1;
        count = c1;
      }
    }

    // 2) Normalize each row into a "call event"
    const callEvents = (data ?? [])
      .map((row) => {
        let payload = row.raw_payload ?? {};
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = {};
          }
        }

        // Your structure looks like: { raw: { body: { data: { event_type, payload: {...} } } } }
        const rawNode = payload.raw || payload;
        const bodyNode = rawNode.body || rawNode;
        const dataNode = bodyNode.data || bodyNode;
        const innerPayload =
          dataNode.payload || payload.payload || dataNode || payload;

        const eventTypeRaw =
          row.event_type ||
          dataNode.event_type ||
          payload.event_type ||
          "";
        const eventType = eventTypeRaw.toString().toLowerCase();

        // Only care about call.* events here
        if (!eventType.startsWith("call.")) {
          return null;
        }

        const fromNumber =
          innerPayload.from?.phone_number ||
          innerPayload.from_number ||
          innerPayload.from ||
          null;

        const toNumber =
          innerPayload.to?.phone_number ||
          (Array.isArray(innerPayload.to) &&
            innerPayload.to[0] &&
            innerPayload.to[0].phone_number) ||
          innerPayload.to_number ||
          innerPayload.to ||
          null;

        const direction =
          row.direction ||
          innerPayload.direction ||
          innerPayload.call_direction ||
          null;

        const time =
          innerPayload.occurred_at ||
          innerPayload.timestamp ||
          dataNode.occurred_at ||
          payload.timestamp ||
          row.created_at ||
          null;

        const durationSeconds =
          innerPayload.duration ||
          innerPayload.duration_seconds ||
          innerPayload.call_duration ||
          (innerPayload.call_duration_ms
            ? Math.round(innerPayload.call_duration_ms / 1000)
            : null);

        // Try to get a stable per-call key
        const callKey =
          innerPayload.call_control_id ||
          innerPayload.call_session_id ||
          innerPayload.call_leg_id ||
          innerPayload.call_id ||
          // fallback: unique-ish composite
          `${eventTypeRaw}:${fromNumber || ""}->${toNumber || ""}:${
            time || row.id
          }`;

        return {
          rawId: row.id,
          callKey,
          eventTypeRaw,
          eventType,
          time,
          direction,
          fromNumber,
          toNumber,
          durationSeconds,
          rawRow: row,
        };
      })
      .filter(Boolean);

    // 3) Group events per callKey
    const groupsByKey = new Map();

    for (const ev of callEvents) {
      const key = ev.callKey;
      if (!groupsByKey.has(key)) {
        groupsByKey.set(key, []);
      }
      groupsByKey.get(key).push(ev);
    }

    // 4) Build one "call" record per group
    const callsGrouped = [];

    for (const [callKey, events] of groupsByKey.entries()) {
      // sort events by time to compute duration if needed
      const sorted = events
        .slice()
        .sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0));

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      // Derive outcome from all event types
      const allTypes = events.map((e) => e.eventType);

      let derivedOutcome = null;
      if (allTypes.some((t) => t.includes("miss"))) {
        derivedOutcome = "missed";
      } else if (allTypes.some((t) => t.includes("answer"))) {
        derivedOutcome = "answered";
      } else if (
        allTypes.some(
          (t) =>
            t.includes("hangup") ||
            t.includes("completed") ||
            t.includes("end")
        )
      ) {
        derivedOutcome = "completed";
      }

      // Direction, numbers: just take the first non-null values
      const direction =
        first.direction ||
        events.find((e) => e.direction)?.direction ||
        null;
      const fromNumber =
        first.fromNumber ||
        events.find((e) => e.fromNumber)?.fromNumber ||
        null;
      const toNumber =
        first.toNumber ||
        events.find((e) => e.toNumber)?.toNumber ||
        null;

      // Duration: prefer explicit, else time diff
      let durationSeconds =
        events.find((e) => e.durationSeconds)?.durationSeconds || null;

      if (!durationSeconds && first.time && last.time) {
        const startMs = new Date(first.time).getTime();
        const endMs = new Date(last.time).getTime();
        if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
          durationSeconds = Math.round((endMs - startMs) / 1000);
        }
      }

      callsGrouped.push({
        id: callKey, // group id
        time: last.time || first.time || null,
        direction,
        outcome: derivedOutcome || events[0].eventTypeRaw || null,
        fromNumber,
        toNumber,
        durationSeconds,
        answeredByAi: false, // will be filled later
        // canonical linkage (filled later)
        inboxLeadId: null,
        leadId: null,
        profileId: null,
        customerId: null,
      });
    }

    // 5) Link calls to inbox_leads (by phone / customer_phone) for THIS customer_id
    const phoneSet = new Set();
    for (const c of callsGrouped) {
      if (c.fromNumber) phoneSet.add(c.fromNumber);
      if (c.toNumber) phoneSet.add(c.toNumber);
    }
    const phoneList = Array.from(phoneSet).filter(Boolean);

    let leadsByPhone = {};
    if (phoneList.length > 0) {
      // Match against inbox_leads.phone for this tenant
      const { data: leadsPhoneData, error: leadsPhoneError } = await supabase
        .from("inbox_leads")
        .select("id, phone, customer_phone, customer_id, lead_id, profile_id")
        .eq("customer_id", customerId)
        .in("phone", phoneList);

      if (leadsPhoneError) {
        console.error("[/api/calls] inbox_leads by phone error:", leadsPhoneError);
      } else {
        for (const lead of leadsPhoneData || []) {
          if (lead.phone) {
            leadsByPhone[lead.phone] = lead;
          }
        }
      }

      // Match against inbox_leads.customer_phone for this tenant
      const { data: leadsCustData, error: leadsCustError } = await supabase
        .from("inbox_leads")
        .select("id, phone, customer_phone, customer_id, lead_id, profile_id")
        .eq("customer_id", customerId)
        .in("customer_phone", phoneList);

      if (leadsCustError) {
        console.error(
          "[/api/calls] inbox_leads by customer_phone error:",
          leadsCustError
        );
      } else {
        for (const lead of leadsCustData || []) {
          if (lead.customer_phone) {
            leadsByPhone[lead.customer_phone] = lead;
          }
        }
      }
    }

    for (const c of callsGrouped) {
      const leadMatch =
        (c.fromNumber && leadsByPhone[c.fromNumber]) ||
        (c.toNumber && leadsByPhone[c.toNumber]) ||
        null;

      if (leadMatch) {
        c.inboxLeadId = leadMatch.id;                 // thread
        c.leadId = leadMatch.lead_id || null;         // canonical leads.id
        c.profileId = leadMatch.profile_id || null;   // lead_profiles.id
        c.customerId = leadMatch.customer_id || null; // tenant
      }
    }

    // 6) Mark AI follow-up: outbound messages for that canonical lead_id
    const leadIds = Array.from(
      new Set(
        callsGrouped
          .map((c) => c.leadId)
          .filter((id) => typeof id === "number" || typeof id === "string")
      )
    );

    let leadIdsWithOutboundSms = new Set();
    if (leadIds.length > 0) {
      // Prefer tenant-scoped inbox_messages query if customer_id exists; fallback to original query if not.
      const baseQuery = supabase
        .from("inbox_messages")
        .select("id, lead_id, direction, message_type")
        .in("lead_id", leadIds)
        .eq("direction", "outbound");

      const { data: msgData1, error: msgError1 } = await baseQuery.eq(
        "customer_id",
        customerId
      );

      if (msgError1) {
        const msg = (msgError1.message || "").toLowerCase();
        const looksLikeMissingColumn =
          msg.includes("column") && msg.includes("customer_id") && msg.includes("does not exist");

        if (!looksLikeMissingColumn) {
          console.error("[/api/calls] inbox_messages error:", msgError1);
        } else {
          const { data: msgData2, error: msgError2 } = await supabase
            .from("inbox_messages")
            .select("id, lead_id, direction, message_type")
            .in("lead_id", leadIds)
            .eq("direction", "outbound");

          if (msgError2) {
            console.error("[/api/calls] inbox_messages error:", msgError2);
          } else {
            for (const m of msgData2 || []) {
              // we don't strictly require sms vs mms yet
              leadIdsWithOutboundSms.add(m.lead_id);
            }
          }
        }
      } else {
        for (const m of msgData1 || []) {
          // we don't strictly require sms vs mms yet
          leadIdsWithOutboundSms.add(m.lead_id);
        }
      }
    }

    for (const c of callsGrouped) {
      if (c.leadId && leadIdsWithOutboundSms.has(c.leadId)) {
        c.answeredByAi = true;
      }
    }

    // 7) Filter to THIS customer only, to be multi-tenant safe
    const tenantCalls = callsGrouped.filter(
      (c) =>
        c.customerId === customerId ||
        c.customerId === Number.parseInt(customerId, 10)
    );

    // 8) Apply outcome filter (All / Missed / Answered) on tenant-scoped calls
    let filtered = tenantCalls;
    if (outcomeFilter === "missed") {
      filtered = tenantCalls.filter((c) => {
        const o = (c.outcome || "").toString().toLowerCase();
        return o.includes("miss");
      });
    } else if (outcomeFilter === "answered") {
      filtered = tenantCalls.filter((c) => {
        const o = (c.outcome || "").toString().toLowerCase();
        return o.includes("answer") || o === "answered";
      });
    }

    // Sort by time desc (latest first)
    filtered.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    return res.status(200).json({
      data: filtered,
      pagination: {
        page,
        pageSize,
        total: filtered.length,
        hasMore: (count ?? (data || []).length) > to + 1,
      },
      filters: {
        outcome: outcomeFilter,
      },
    });
  } catch (err) {
    console.error("[/api/calls] Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
}
