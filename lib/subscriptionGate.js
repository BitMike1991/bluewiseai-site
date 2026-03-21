// lib/subscriptionGate.js — Kill Switch core library
import { getSupabaseServerClient } from "./supabaseServer";

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const BILLING_CHANNEL = "#bluewise-billing";

/**
 * Fetch subscription for a customer. Returns null if no subscription (internal user).
 */
export async function getSubscription(customerId) {
  const sb = getSupabaseServerClient();
  const { data, error } = await sb
    .from("subscriptions")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Returns true if the customer should have platform access.
 * No subscription row = internal user = always allowed.
 * Fail-open on errors.
 */
export function isAccessAllowed(subscription) {
  if (!subscription) return true; // no row = internal user
  return subscription.status === "active" || subscription.status === "grace";
}

/**
 * Suspend a customer. Updates status + logs event.
 */
export async function suspendCustomer(customerId, actor = "system") {
  const sb = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { error: updateErr } = await sb
    .from("subscriptions")
    .update({ status: "suspended", suspended_at: now, updated_at: now })
    .eq("customer_id", customerId);
  if (updateErr) throw updateErr;

  await logEvent(customerId, "suspended", actor, { suspended_at: now });
  await sendBillingSlack(
    `Customer ${customerId} has been SUSPENDED. Platform access blocked.`,
    "critical"
  );
}

/**
 * Reactivate a customer. Restores status, advances period, logs event.
 */
export async function reactivateCustomer(customerId, invoiceId, actor = "admin") {
  const sb = getSupabaseServerClient();
  const now = new Date().toISOString();

  // Mark invoice as paid if provided
  if (invoiceId) {
    await sb
      .from("subscription_invoices")
      .update({ status: "paid", paid_at: now, updated_at: now })
      .eq("id", invoiceId);
  }

  // Advance to next period
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const { error: updateErr } = await sb
    .from("subscriptions")
    .update({
      status: "active",
      suspended_at: null,
      last_paid_at: now,
      current_period_start: periodStart.toISOString().split("T")[0],
      current_period_end: periodEnd.toISOString().split("T")[0],
      updated_at: now,
    })
    .eq("customer_id", customerId);
  if (updateErr) throw updateErr;

  await logEvent(customerId, "reactivated", actor, { invoice_id: invoiceId });
  await sendBillingSlack(
    `Customer ${customerId} has been REACTIVATED. Platform access restored.`,
    "info"
  );
}

/**
 * Move customer to grace period.
 */
export async function enterGracePeriod(customerId) {
  const sb = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { error } = await sb
    .from("subscriptions")
    .update({ status: "grace", updated_at: now })
    .eq("customer_id", customerId);
  if (error) throw error;

  await logEvent(customerId, "grace_started", "system", {});
}

/**
 * Compute revenue share for a customer over a date range.
 * Queries the payments table for gross revenue, applies rate.
 */
export async function computeRevenueShare(customerId, startDate, endDate, rate) {
  const sb = getSupabaseServerClient();

  const { data, error } = await sb
    .from("payments")
    .select("amount")
    .eq("customer_id", customerId)
    .gte("created_at", startDate)
    .lt("created_at", endDate);

  if (error) throw error;

  const grossRevenue = (data || []).reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    performanceFee: Math.round(grossRevenue * rate * 100) / 100,
    rate,
  };
}

/**
 * Log a subscription event.
 */
export async function logEvent(customerId, eventType, actor, payload = {}) {
  const sb = getSupabaseServerClient();
  await sb.from("subscription_events").insert({
    customer_id: customerId,
    event_type: eventType,
    actor,
    payload,
  });
}

/**
 * Send Slack notification for billing events.
 */
export async function sendBillingSlack(text, urgency = "info") {
  if (!SLACK_TOKEN) return;

  const prefix = urgency === "critical" ? "🚨" : urgency === "warning" ? "⚠️" : "💰";

  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: BILLING_CHANNEL,
        text: `${prefix} ${text}`,
      }),
    });
  } catch (e) {
    console.error("Slack billing notification failed:", e.message);
  }
}

/**
 * Fetch n8n workflow IDs for a customer from the DB.
 * Returns an array of workflow ID strings.
 */
export async function getCustomerWorkflowIds(customerId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase env vars for workflow lookup");
    return [];
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&select=n8n_workflow_ids`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const rows = await res.json();
    if (!rows || rows.length === 0) return [];
    return rows[0].n8n_workflow_ids || [];
  } catch (e) {
    console.error("Failed to fetch customer workflow IDs:", e.message);
    return [];
  }
}

/**
 * Toggle n8n workflows on/off for a specific customer.
 * Fetches that customer's workflow IDs from DB, then toggles them.
 * @param {number} customerId - the customer whose workflows to toggle
 * @param {boolean} activate - true to activate, false to deactivate
 */
export async function toggleN8nWorkflows(customerId, activate) {
  const apiKey = process.env.N8N_API_KEY;
  if (!apiKey) {
    console.error("N8N_API_KEY not set, cannot toggle workflows");
    return { success: false, error: "N8N_API_KEY not set" };
  }

  const workflowIds = await getCustomerWorkflowIds(customerId);
  if (workflowIds.length === 0) {
    return { success: true, results: [], message: "No workflows configured for this customer" };
  }

  const baseUrl = "https://automation.bluewiseai.com/api/v1";
  const results = [];

  for (const id of workflowIds) {
    try {
      const res = await fetch(`${baseUrl}/workflows/${id}/${activate ? "activate" : "deactivate"}`, {
        method: "POST",
        headers: { "X-N8N-API-KEY": apiKey },
      });
      const data = await res.json();
      results.push({ id, success: res.ok, active: data.active });
    } catch (e) {
      results.push({ id, success: false, error: e.message });
    }
  }

  return { success: results.every((r) => r.success), results };
}
