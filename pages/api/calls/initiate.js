// pages/api/calls/initiate.js — Click-to-call via Telnyx Call Control

import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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

    const { checkRateLimit } = await import("../../../lib/security");
    if (checkRateLimit(req, res, `call:${customerId}`, 10)) return;

    const { leadPhone } = req.body;
    if (!leadPhone) {
      return res.status(400).json({ error: "leadPhone is required" });
    }

    // Get customer's SIP URI and Telnyx number
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("telnyx_sip_uri, telnyx_number, business_name")
      .eq("id", customerId)
      .single();

    if (custErr || !customer) {
      return res.status(500).json({ error: "Could not load customer config" });
    }

    if (!customer.telnyx_sip_uri) {
      return res.status(400).json({ error: "No SIP phone configured for this account" });
    }

    if (!customer.telnyx_number) {
      return res.status(400).json({ error: "No Telnyx number configured" });
    }

    // Step 1: Dial the customer's SIP phone (Groundwire)
    const telnyxRes = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        connection_id: "2886901898399450925",
        to: customer.telnyx_sip_uri,
        from: customer.telnyx_number,
        answering_machine_detection: "disabled",
        record: "record-from-answer",
        record_format: "mp3",
        record_channels: "dual",
        client_state: Buffer.from(
          JSON.stringify({
            direction: "outbound",
            customer_id: customerId,
            lead_phone: leadPhone,
            business_name: customer.business_name,
          })
        ).toString("base64"),
      }),
    });

    if (!telnyxRes.ok) {
      const errBody = await telnyxRes.text();
      console.error("Telnyx call error:", errBody);
      return res.status(502).json({ error: "Failed to initiate call" });
    }

    const callData = await telnyxRes.json();
    const callControlId = callData?.data?.call_control_id;

    // Log the outbound call in call_routing_state
    await supabase.from("call_routing_state").insert({
      call_control_id: callControlId,
      customer_id: customerId,
      direction: "outbound",
      from_number: customer.telnyx_number,
      to_number: leadPhone,
      sip_attempted: true,
      sip_dial_started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      call_control_id: callControlId,
      message: "Call initiated — your phone will ring shortly",
    });
  } catch (err) {
    console.error("Call initiate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
