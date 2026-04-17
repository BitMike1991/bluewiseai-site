// pages/api/jobs/index.js
import { getAuthContext } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId)
    return res.status(403).json({ error: "No customer mapping for this user" });

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
      .eq("customer_id", customerId);

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
