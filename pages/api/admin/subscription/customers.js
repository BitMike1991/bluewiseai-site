// pages/api/admin/subscription/customers.js
// Returns list of all customers for admin billing selector.
import { getAuthContext, getSupabaseServerClient } from "../../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (customerId !== 1) return res.status(403).json({ error: "Admin only" });

  try {
    const sb = getSupabaseServerClient();

    // Fetch all customers
    const { data: allCustomers, error: custErr } = await sb
      .from("customers")
      .select("id, name")
      .order("id", { ascending: true });

    if (custErr) throw custErr;

    // Fetch which customers have subscriptions
    const { data: subs, error: subErr } = await sb
      .from("subscriptions")
      .select("customer_id");

    if (subErr) throw subErr;

    const subSet = new Set((subs || []).map((s) => s.customer_id));

    const customers = (allCustomers || []).map((c) => ({
      id: c.id,
      name: c.name || `Customer ${c.id}`,
      has_subscription: subSet.has(c.id),
    }));

    return res.status(200).json({ customers });
  } catch (err) {
    console.error("Customers list error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
