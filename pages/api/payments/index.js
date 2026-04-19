// pages/api/payments/index.js
// Create a manual payment record. Used by Jérémy's TabPaiements "Ajouter" form
// for non-Interac methods (cash, cheque, wire). Interac payments come in
// automatically via the n8n Email Poller → Universal Interac Payment Received
// webhook pipeline.

import { getAuthContext } from "../../../lib/supabaseServer";
import { alertJeremy } from "../../../lib/notifications/jeremy-alert";
import { createAutoTasks } from "../../../lib/tasks/auto";

const ALLOWED_METHODS = ["POST"];

// Payment methods the manual form accepts. Keep `interac` available so Jérémy
// CAN manually log an Interac he confirmed by phone (rare but legit).
const VALID_METHODS = new Set(["interac", "cash", "cheque", "wire", "stripe", "other"]);
// Payment types track the billing milestone.
const VALID_TYPES = new Set(["deposit", "balance", "partial", "installment", "refund"]);

// Job status transitions triggered by a logged deposit payment.
// Canonical status keys come from lib/status-config.js (order 8 → 9).
const DEPOSIT_STATUS_FLIP = {
  contract_signed:   "deposit_received",
  awaiting_deposit:  "deposit_received",
  deposit_received:  "deposit_received",   // idempotent
};

export default async function handler(req, res) {
  if (!ALLOWED_METHODS.includes(req.method)) {
    res.setHeader("Allow", ALLOWED_METHODS);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  const {
    job_id,
    amount,
    method,
    payment_type = "partial",
    reference_number,
    paid_at,
    note,
    subtotal,
    tps,
    tvq,
    receipt_url,
  } = req.body || {};

  // ── Validation ──
  if (job_id == null) return res.status(400).json({ error: "job_id required" });
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  if (!VALID_METHODS.has(method)) {
    return res.status(400).json({ error: `method must be one of ${[...VALID_METHODS].join(", ")}` });
  }
  if (!VALID_TYPES.has(payment_type)) {
    return res.status(400).json({ error: `payment_type must be one of ${[...VALID_TYPES].join(", ")}` });
  }

  // ── Tenant guard: the job must belong to this customer ──
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, job_id, status, customer_id, client_name")
    .eq("id", job_id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (jobErr) return res.status(500).json({ error: jobErr.message });
  if (!job)   return res.status(404).json({ error: "Job not found" });

  const nowIso = new Date().toISOString();
  const paidAtNorm = paid_at ? new Date(paid_at).toISOString() : nowIso;

  // ── Insert payment ──
  const paymentRow = {
    customer_id: customerId,
    job_id: job.id,
    amount: Math.round(amt * 100) / 100,
    currency: "CAD",
    payment_method: method,
    payment_type,
    status: "succeeded",
    paid_at: paidAtNorm,
    confirmed_by: user.email || user.id,
    subtotal: subtotal != null ? Number(subtotal) : null,
    tps:      tps      != null ? Number(tps)      : null,
    tvq:      tvq      != null ? Number(tvq)      : null,
    receipt_url: receipt_url || null,
    meta: {
      entered_via: "manual_ui",
      reference_number: reference_number || null,
      note: note || null,
      entered_by: user.email || user.id,
      entered_at: nowIso,
    },
  };

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert(paymentRow)
    .select("id, amount, payment_type, payment_method, paid_at, status")
    .single();

  if (payErr) {
    console.error("[/api/payments] insert error", payErr);
    return res.status(500).json({ error: "Failed to record payment", details: payErr.message });
  }

  // ── Auto status flip on deposit ──
  // Only for deposit payments that succeed, and only when the job is in a
  // state where deposit-received makes sense. Skip silently otherwise.
  let newJobStatus = null;
  // Only fire the transition (and downstream Jérémy SMS alert) when the job
  // actually moved into `deposit_received` for the first time. Recording a
  // partial top-up on a job already in `deposit_received` must NOT re-trigger
  // the SMS — CoVe finding 2026-04-19.
  if (payment_type === "deposit") {
    const nextStatus = DEPOSIT_STATUS_FLIP[job.status];
    if (nextStatus && nextStatus !== job.status) {
      const { error: updErr } = await supabase
        .from("jobs")
        .update({
          status: nextStatus,
          deposit_paid_at: paidAtNorm,
          updated_at: nowIso,
        })
        .eq("id", job.id)
        .eq("customer_id", customerId);
      if (!updErr) newJobStatus = nextStatus;
    }
    // Intentionally no `else` — keeping newJobStatus as null on the idempotent
    // path prevents the deposit alert from re-firing.
  }

  // ── Log job_event for ops + audit ──
  try {
    await supabase.from("job_events").insert({
      job_id: job.id,
      customer_id: customerId,
      event_type: "payment_recorded",
      payload: {
        payment_id: payment.id,
        amount: payment.amount,
        method,
        payment_type,
        reference_number: reference_number || null,
        note: note || null,
        entered_by: user.email || user.id,
        resulting_status: newJobStatus,
      },
    });
  } catch (e) {
    console.warn("[/api/payments] job_event log failed", e?.message);
  }

  // Alert Jérémy directly when a deposit is received.
  // Avoid pinging on manual partial payments — only the first deposit that
  // transitions status is interesting enough to SMS.
  if (payment_type === "deposit" && newJobStatus === "deposit_received") {
    alertJeremy(supabase, {
      customerId,
      eventType: "deposit_received",
      payload: {
        job_id_human: job.job_id,
        client_name: job.client_name,
        total_ttc: payment.amount,
        method,
        job_url: `https://bluewiseai.com/platform/jobs/${job.id}`,
      },
    }).catch(() => {});

    createAutoTasks(supabase, {
      customerId,
      jobId: job.id,
      eventType: "deposit_received",
    }).catch(() => {});
  }

  return res.status(201).json({
    success: true,
    payment,
    job_status: newJobStatus || job.status,
  });
}
