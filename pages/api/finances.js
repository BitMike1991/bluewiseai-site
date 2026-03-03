// pages/api/finances.js
import { getAuthContext } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // All financial logs for this customer, most recent first
    const { data: logs, error: logsErr } = await supabase
      .from("financial_logs")
      .select("id, log_type, amount, client, vendor, category, method, note, submitted_by, receipt_url, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (logsErr) throw logsErr;

    // Compute summary KPIs
    let totalPayments = 0;
    let totalExpenses = 0;
    let monthPayments = 0;
    let monthExpenses = 0;
    const byPerson = {};

    for (const log of logs || []) {
      const amt = parseFloat(log.amount) || 0;
      const person = log.submitted_by || "Unknown";

      if (!byPerson[person]) {
        byPerson[person] = { payments: 0, expenses: 0 };
      }

      if (log.log_type === "payment") {
        totalPayments += amt;
        if (log.created_at >= monthStart) monthPayments += amt;
        byPerson[person].payments += amt;
      } else if (log.log_type === "expense") {
        totalExpenses += amt;
        if (log.created_at >= monthStart) monthExpenses += amt;
        byPerson[person].expenses += amt;
      }
    }

    return res.status(200).json({
      logs: logs || [],
      summary: {
        totalPayments: Math.round(totalPayments * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalProfit: Math.round((totalPayments - totalExpenses) * 100) / 100,
        monthPayments: Math.round(monthPayments * 100) / 100,
        monthExpenses: Math.round(monthExpenses * 100) / 100,
        monthProfit: Math.round((monthPayments - monthExpenses) * 100) / 100,
      },
      byPerson,
    });
  } catch (err) {
    console.error("Finances API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
