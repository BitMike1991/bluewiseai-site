// pages/api/settings.js
import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          [
            "id",
            "business_name",
            "telnyx_number",
            "sms_number",
            "timezone",
            "industry",
            "booking_link",
            "inbox_email",
            "service_niche",
            "main_offer",
            "tone_profile",
            "email_signature",
            "signature",
            "sms_template",
            "after_hours_sms_template",
            "business_hours_start",
            "business_hours_end",
            "sms_enabled",
          ].join(",")
        )
        .eq("id", customerId)
        .single();

      if (error) {
        console.error("[api/settings] Supabase error (GET)", error);
        return res
          .status(500)
          .json({ error: "Failed to load settings", details: error.message });
      }

      if (!data) {
        return res.status(404).json({ error: "Settings not found" });
      }

      // Normalize into a front-end friendly shape
      const payload = {
        id: data.id,
        businessName: data.business_name || "",
        telnyxNumber: data.telnyx_number || "",
        smsNumber: data.sms_number || "",
        timezone: data.timezone || "America/Toronto",
        industry: data.industry || "",
        bookingLink: data.booking_link || "",
        inboxEmail: data.inbox_email || "",
        serviceNiche: data.service_niche || "",
        mainOffer: data.main_offer || "",
        toneProfile: data.tone_profile || "",
        emailSignature: data.email_signature || data.signature || "",
        smsTemplate: data.sms_template || "",
        afterHoursSmsTemplate: data.after_hours_sms_template || "",
        businessHoursStart: data.business_hours_start || "",
        businessHoursEnd: data.business_hours_end || "",
        smsEnabled: !!data.sms_enabled,
      };

      return res.status(200).json(payload);
    } catch (err) {
      console.error("[api/settings] Unexpected error (GET)", err);
      return res
        .status(500)
        .json({ error: "Unexpected error loading settings" });
    }
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      const body = req.body || {};

      // Defensive: only update allowed fields
      const update = {
        business_name: body.businessName ?? undefined,
        telnyx_number: body.telnyxNumber ?? undefined,
        sms_number: body.smsNumber ?? undefined,
        timezone: body.timezone ?? undefined,
        industry: body.industry ?? undefined,
        booking_link: body.bookingLink ?? undefined,
        inbox_email: body.inboxEmail ?? undefined,
        service_niche: body.serviceNiche ?? undefined,
        main_offer: body.mainOffer ?? undefined,
        tone_profile: body.toneProfile ?? undefined,
        email_signature: body.emailSignature ?? undefined,
        sms_template: body.smsTemplate ?? undefined,
        after_hours_sms_template: body.afterHoursSmsTemplate ?? undefined,
        business_hours_start: body.businessHoursStart ?? undefined,
        business_hours_end: body.businessHoursEnd ?? undefined,
        sms_enabled:
          typeof body.smsEnabled === "boolean" ? body.smsEnabled : undefined,
        updated_at: new Date().toISOString(),
      };

      // Strip undefined keys so Supabase only touches real values
      Object.keys(update).forEach((key) => {
        if (update[key] === undefined) {
          delete update[key];
        }
      });

      const { data, error } = await supabase
        .from("customers")
        .update(update)
        .eq("id", customerId)
        .select(
          [
            "id",
            "business_name",
            "telnyx_number",
            "sms_number",
            "timezone",
            "industry",
            "booking_link",
            "inbox_email",
            "service_niche",
            "main_offer",
            "tone_profile",
            "email_signature",
            "signature",
            "sms_template",
            "after_hours_sms_template",
            "business_hours_start",
            "business_hours_end",
            "sms_enabled",
          ].join(",")
        )
        .single();

      if (error) {
        console.error("[api/settings] Supabase error (PATCH)", error);
        return res
          .status(500)
          .json({ error: "Failed to save settings", details: error.message });
      }

      const payload = {
        id: data.id,
        businessName: data.business_name || "",
        telnyxNumber: data.telnyx_number || "",
        smsNumber: data.sms_number || "",
        timezone: data.timezone || "America/Toronto",
        industry: data.industry || "",
        bookingLink: data.booking_link || "",
        inboxEmail: data.inbox_email || "",
        serviceNiche: data.service_niche || "",
        mainOffer: data.main_offer || "",
        toneProfile: data.tone_profile || "",
        emailSignature: data.email_signature || data.signature || "",
        smsTemplate: data.sms_template || "",
        afterHoursSmsTemplate: data.after_hours_sms_template || "",
        businessHoursStart: data.business_hours_start || "",
        businessHoursEnd: data.business_hours_end || "",
        smsEnabled: !!data.sms_enabled,
      };

      return res.status(200).json(payload);
    } catch (err) {
      console.error("[api/settings] Unexpected error (PATCH)", err);
      return res
        .status(500)
        .json({ error: "Unexpected error saving settings" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
}
