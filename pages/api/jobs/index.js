// pages/api/jobs/index.js
import crypto from "crypto";
import { getAuthContext, getSupabaseServerClient } from "../../../lib/supabaseServer";
import { mergeConfig } from "../../../lib/quote-config.js";
import { resolveDivisionId } from "../../../lib/divisions";

const ALLOWED_METHODS = ["GET", "POST"];

// CSPRNG job id. 16 hex chars = 64 bits of entropy. Legacy 6-digit ids stay
// readable by every downstream system (no migration needed for existing jobs).
function generateJobId(prefix) {
  return (prefix || 'BW') + '-' + crypto.randomBytes(8).toString('hex');
}

export default async function handler(req, res) {
  if (!ALLOWED_METHODS.includes(req.method)) {
    res.setHeader("Allow", ALLOWED_METHODS);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user, role, divisionId } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId)
    return res.status(403).json({ error: "No customer mapping for this user" });

  // ─── POST: create a new job, optionally prefilled from a lead ───
  if (req.method === "POST") {
    try {
      const { lead_id = null, client_name = '', client_phone = '', client_email = '', client_address = null, project_description = null, project_type = null, division_id: explicitDivisionId = null } = req.body || {};

      // Pull lead info if lead_id provided, to prefill client fields
      let lead = null;
      if (lead_id) {
        const { data: leadRow } = await supabase
          .from("leads")
          .select("id, name, first_name, last_name, phone, email, address, city, project_type, source")
          .eq("customer_id", customerId)
          .eq("id", lead_id)
          .maybeSingle();
        lead = leadRow || null;
      }

      // Customer quote_config for prefix
      const { data: customer } = await supabase
        .from("customers")
        .select("quote_config")
        .eq("id", customerId)
        .maybeSingle();
      const config = mergeConfig(customer?.quote_config);
      const prefix = config.quote?.prefix || 'BW';

      const effectiveName =
        client_name
        || lead?.name
        || [lead?.first_name, lead?.last_name].filter(Boolean).join(' ').trim()
        || '';
      const effectivePhone = client_phone || lead?.phone || '';
      const effectiveEmail = client_email || lead?.email || '';
      // Address: accept object or build from lead's address + city
      const effectiveAddress = client_address
        ?? (lead
          ? { street: lead.address || '', city: lead.city || '', province: 'QC', postal_code: '' }
          : null);
      const effectiveProjectType = project_type || lead?.project_type || null;

      const job_id = generateJobId(prefix);
      const nowIso = new Date().toISOString();

      const admin = getSupabaseServerClient();
      const resolvedDivisionId = await resolveDivisionId(admin, {
        customer_id: customerId,
        role,
        user_division_id: divisionId,
        lead_id: lead?.id || null,
        explicit: explicitDivisionId,
      });

      const { data: newJob, error: jobErr } = await supabase
        .from("jobs")
        .insert({
          job_id,
          customer_id: customerId,
          division_id: resolvedDivisionId,
          lead_id: lead?.id || null,
          client_name:    effectiveName || null,
          client_phone:   effectivePhone || null,
          client_email:   effectiveEmail || null,
          client_address: effectiveAddress,
          project_type:   effectiveProjectType,
          project_description,
          status: 'draft',
          intake_source: lead?.source || 'manual',
          quote_amount: 0,
          payment_terms: config.payment_schedule || null,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select("id, job_id")
        .single();

      if (jobErr) {
        console.error("[api/jobs POST] insert error", jobErr);
        return res.status(500).json({ error: "Erreur création projet" });
      }

      // Create an empty draft quote so the Devis tab is immediately usable.
      // Inherits division from the job we just created.
      const { data: newQuote } = await supabase
        .from("quotes")
        .insert({
          customer_id: customerId,
          division_id: resolvedDivisionId,
          job_id: newJob.id,
          quote_number: job_id,
          version: 1,
          status: 'draft',
          line_items: [],
          subtotal: 0,
          tax_gst: 0,
          tax_qst: 0,
          total_ttc: 0,
          valid_until: new Date(Date.now() + ((config.quote?.valid_days || 15) * 86400000)).toISOString().split('T')[0],
          meta: { created_via: lead_id ? 'lead_button' : 'new_project_button' },
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select("id")
        .single();

      return res.status(201).json({
        id: newJob.id,
        job_id: newJob.job_id,
        quote_id: newQuote?.id || null,
      });
    } catch (err) {
      console.error("[api/jobs POST] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  const { checkRateLimit } = await import("../../../lib/security");
  if (checkRateLimit(req, res, `read:${customerId}`, 120)) return;

  try {
    const { status, search, page = "1", pageSize = "20", from: fromDate, to: toDate } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * sizeNum;

    const term = search && search.trim().length > 0 ? search.trim() : null;

    let jobsQuery = supabase
      .from("jobs")
      .select(
        `
        id,
        job_id,
        customer_id,
        lead_id,
        client_name,
        client_phone,
        client_email,
        client_address,
        project_type,
        project_description,
        quote_amount,
        deposit_amount,
        deposit_percentage,
        status,
        intake_source,
        meta,
        created_at,
        updated_at,
        quote_sent_at,
        contract_sent_at,
        signed_at,
        deposit_paid_at,
        scheduled_at,
        started_at,
        completed_at,
        cancelled_at
      `,
        { count: "exact" }
      )
      .eq("customer_id", customerId)
      .is("deleted_at", null);

    // Status filter: supports comma-separated multi-status e.g. ?status=draft,measuring
    if (status && status !== "all") {
      const statusList = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statusList.length === 1) {
        jobsQuery = jobsQuery.eq("status", statusList[0]);
      } else if (statusList.length > 1) {
        jobsQuery = jobsQuery.in("status", statusList);
      }
    }

    // Date range filter on updated_at
    if (fromDate) {
      jobsQuery = jobsQuery.gte("updated_at", new Date(fromDate).toISOString());
    }
    if (toDate) {
      // Add one day so toDate is inclusive
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);
      jobsQuery = jobsQuery.lt("updated_at", end.toISOString());
    }

    if (term) {
      const { sanitizeSearchTerm } = await import("../../../lib/security");
      const safe = sanitizeSearchTerm(term);
      if (safe) {
        jobsQuery = jobsQuery.or(
          [
            `client_name.ilike.%${safe}%`,
            `client_email.ilike.%${safe}%`,
            `client_phone.ilike.%${safe}%`,
            `job_id.ilike.%${safe}%`,
            `project_type.ilike.%${safe}%`,
          ].join(",")
        );
      }
    }

    jobsQuery = jobsQuery
      .order("updated_at", { ascending: false })
      .range(offset, offset + sizeNum - 1);

    const { data: jobRows, error: jobError, count: totalCount } =
      await jobsQuery;
    if (jobError) throw jobError;

    const jobs = jobRows || [];

    if (jobs.length === 0) {
      return res.status(200).json({
        items: [],
        total: totalCount || 0,
        page: pageNum,
        pageSize: sizeNum,
      });
    }

    // Fetch contracts, payments, and latest quote per job
    const jobIds = jobs.map((j) => j.id);

    const [contractsRes, paymentsRes, quotesRes] = await Promise.all([
      supabase
        .from("contracts")
        .select("id, job_id, signature_status, signed_at")
        .eq("customer_id", customerId)
        .in("job_id", jobIds),
      supabase
        .from("payments")
        .select("id, job_id, payment_type, amount, status, paid_at")
        .eq("customer_id", customerId)
        .in("job_id", jobIds),
      supabase
        .from("quotes")
        .select("id, job_id, total_ttc, version, status, updated_at")
        .eq("customer_id", customerId)
        .in("job_id", jobIds)
        .order("version", { ascending: false }),
    ]);

    const contractsByJobId = new Map();
    if (contractsRes.data) {
      for (const c of contractsRes.data) {
        if (!contractsByJobId.has(c.job_id)) contractsByJobId.set(c.job_id, []);
        contractsByJobId.get(c.job_id).push(c);
      }
    }

    const paymentsByJobId = new Map();
    if (paymentsRes.data) {
      for (const p of paymentsRes.data) {
        if (!paymentsByJobId.has(p.job_id)) paymentsByJobId.set(p.job_id, []);
        paymentsByJobId.get(p.job_id).push(p);
      }
    }

    // Keyed by job_id → latest quote (already sorted by version DESC, first match wins)
    const latestQuoteByJobId = new Map();
    if (quotesRes.data) {
      for (const q of quotesRes.data) {
        if (!latestQuoteByJobId.has(q.job_id)) {
          latestQuoteByJobId.set(q.job_id, q);
        }
      }
    }

    const items = jobs.map((job) => {
      const contracts = contractsByJobId.get(job.id) || [];
      const payments = paymentsByJobId.get(job.id) || [];
      const latestQuote = latestQuoteByJobId.get(job.id) || null;
      const totalPaid = payments
        .filter((p) => p.status === "paid" || p.status === "succeeded")
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      return {
        ...job,
        contracts_count: contracts.length,
        contract_signed: contracts.some((c) => c.signature_status === "signed"),
        payments_count: payments.length,
        total_paid: totalPaid,
        latest_quote_total_ttc: latestQuote?.total_ttc ?? null,
        latest_quote_status: latestQuote?.status ?? null,
      };
    });

    return res.status(200).json({
      items,
      total: totalCount || items.length,
      page: pageNum,
      pageSize: sizeNum,
    });
  } catch (err) {
    console.error("[api/jobs] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
