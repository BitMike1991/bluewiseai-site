// pages/api/inbox/[leadId]/messages.js
// Fetches message thread for a specific lead — used by split-pane inbox.
import { getAuthContext } from "../../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user || !customerId) return res.status(401).json({ error: "Not authenticated" });

  const { checkRateLimit } = await import("../../../../lib/security");
  if (checkRateLimit(req, res, `read:${customerId}`, 120)) return;

  const leadId = parseInt(req.query.leadId, 10);
  if (!leadId || Number.isNaN(leadId)) return res.status(400).json({ error: "Invalid leadId" });

  try {
    // Verify lead belongs to this customer
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, name, email, phone, status, source")
      .eq("customer_id", customerId)
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr || !lead) return res.status(404).json({ error: "Lead not found" });

    // Fetch messages from canonical table
    const { data: messages, error: msgErr } = await supabase
      .from("messages")
      .select("id, lead_id, direction, channel, message_type, subject, body, created_at")
      .eq("customer_id", customerId)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (msgErr) {
      console.error("[inbox/messages] messages query error:", msgErr);
      return res.status(500).json({ error: "Failed to load messages" });
    }

    // Also fetch SMS from inbox_messages if inbox_leads exists
    const { data: inboxLeads } = await supabase
      .from("inbox_leads")
      .select("id")
      .eq("customer_id", String(customerId))
      .eq("lead_id", leadId)
      .limit(1);

    let smsMessages = [];
    if (inboxLeads && inboxLeads.length > 0) {
      const { data: inboxMsgs } = await supabase
        .from("inbox_messages")
        .select("id, lead_id, direction, message_type, body, created_at")
        .eq("lead_id", inboxLeads[0].id)
        .order("created_at", { ascending: true });

      smsMessages = (inboxMsgs || []).map((m) => ({
        id: `inbox-${m.id}`,
        lead_id: leadId,
        direction: m.direction,
        channel: "sms",
        message_type: m.message_type,
        subject: null,
        body: m.body,
        created_at: m.created_at,
      }));
    }

    // Merge and dedup by timestamp + direction (within 2s window)
    const allMessages = [...(messages || []), ...smsMessages];
    const seen = new Set();
    const deduped = allMessages.filter((m) => {
      const key = `${Math.round(new Date(m.created_at).getTime() / 2000)}-${m.direction}-${(m.body || "").slice(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.status(200).json({ lead, messages: deduped });
  } catch (err) {
    console.error("[inbox/messages] error:", err);
    return res.status(500).json({ error: "Failed to load thread" });
  }
}
