// pages/api/lead-capture.js
// Public endpoint for website email capture (ROI calculator, etc.)

import { getSupabaseServerClient } from "../../lib/supabaseServer";
import { checkRateLimit, checkMaxLength } from "../../lib/security";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit: 5/min/IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown";
  if (checkRateLimit(req, res, `lead-capture:${ip}`, 5)) return;

  const { email, name, calculator_results, casl_consent } = req.body || {};

  // CASL consent is mandatory
  if (casl_consent !== true) {
    return res.status(400).json({ error: "Consent is required." });
  }

  // Email is required and must be valid format
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "A valid email is required." });
  }

  if (checkMaxLength(res, email, "Email", 320)) return;
  if (name && checkMaxLength(res, name, "Name", 200)) return;

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const supabase = getSupabaseServerClient();

    // Build notes from calculator results
    const notes = calculator_results
      ? JSON.stringify({
          source: "website_calculator",
          casl_consent: true,
          captured_at: new Date().toISOString(),
          ...calculator_results,
        })
      : JSON.stringify({
          source: "website_calculator",
          casl_consent: true,
          captured_at: new Date().toISOString(),
        });

    const { error: insertError } = await supabase.from("bw_prospects").insert({
      company_name: name || "Website Visitor",
      company_name_normalized: (name || "website visitor").toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      owner_name: name || null,
      status: "new",
      notes,
    });

    if (insertError) {
      console.error("Lead capture insert error:", insertError.message);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Lead capture error:", err.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
