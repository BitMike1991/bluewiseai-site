// lib/divisions.js
// Phase 3 — division_id resolution for INSERT paths.
//
// Hierarchy (first hit wins):
//   1. explicit  — caller-provided, validated against user's permissions
//   2. job_id    — inherit from jobs.division_id
//   3. lead_id   — inherit from leads.division_id
//   4. user's own division_id (if scoped)
//   5. tenant's first active division (stable default)
//   6. null — unscoped (tenant has no divisions, or all divisions inactive)
//
// Pass a Supabase client that can read the required tables. In most cases
// that is the service-role client so the resolver is not itself bounded by
// the RLS it is trying to populate.

export async function resolveDivisionId(supabase, ctx = {}) {
  const {
    customer_id,
    role = null,
    user_division_id = null,
    lead_id = null,
    job_id = null,
    explicit = null,
  } = ctx;
  if (!customer_id) throw new Error('resolveDivisionId: customer_id required');

  // 1. Explicit — only if the requesting user is allowed to choose that division
  if (explicit != null) {
    const allowed = await isDivisionAllowedForUser(supabase, {
      customer_id,
      role,
      user_division_id,
      target_division_id: explicit,
    });
    if (allowed) return explicit;
    // If not allowed we silently drop it and continue — never leak another tenant's id.
  }

  // 2. Inherit from job
  if (job_id != null) {
    const { data } = await supabase
      .from('jobs')
      .select('division_id, customer_id')
      .eq('id', job_id)
      .maybeSingle();
    if (data && data.customer_id === customer_id && data.division_id) return data.division_id;
  }

  // 3. Inherit from lead
  if (lead_id != null) {
    const { data } = await supabase
      .from('leads')
      .select('division_id, customer_id')
      .eq('id', lead_id)
      .maybeSingle();
    if (data && data.customer_id === customer_id && data.division_id) return data.division_id;
  }

  // 4. Creator's own division
  if (user_division_id != null) return user_division_id;

  // 5. Tenant default — first active division by id
  const { data: defaults } = await supabase
    .from('divisions')
    .select('id')
    .eq('customer_id', customer_id)
    .eq('active', true)
    .order('id', { ascending: true })
    .limit(1);
  if (defaults?.[0]?.id) return defaults[0].id;

  // 6. Tenant has no divisions — leave unscoped
  return null;
}

export async function isDivisionAllowedForUser(supabase, opts = {}) {
  const { customer_id, role, user_division_id, target_division_id } = opts;
  if (target_division_id == null) return false;

  // Owner/admin: any division in their tenant
  if (role === 'owner' || role === 'admin') {
    const { data } = await supabase
      .from('divisions')
      .select('id')
      .eq('id', target_division_id)
      .eq('customer_id', customer_id)
      .maybeSingle();
    return !!data;
  }

  // Scoped user: only their own division
  return user_division_id != null && user_division_id === target_division_id;
}
