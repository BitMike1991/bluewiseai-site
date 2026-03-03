import { getAuthContext } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  if (!customerId) return res.status(403).json({ error: "No customer mapping" });

  try {
    // Active follow-ups (scheduled or sent recently)
    const { data: followups } = await supabase
      .from("followups")
      .select("id, followup_type, status, scheduled_for, sent_at, payload, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    const activeFollowups = (followups || []).map(f => ({
      id: f.id,
      type: f.followup_type,
      status: f.status,
      scheduledFor: f.scheduled_for,
      sentAt: f.sent_at,
      payload: f.payload,
      createdAt: f.created_at,
    }));

    // Review requests
    const { data: reviews } = await supabase
      .from("job_reviews")
      .select("id, job_id, rating, review_text, google_clicked, sent_at, responded_at")
      .eq("customer_id", customerId)
      .order("sent_at", { ascending: false })
      .limit(30);

    // Enrich reviews with job info
    let reviewRequests = [];
    if (reviews && reviews.length > 0) {
      const reviewJobIds = [...new Set(reviews.map(r => r.job_id))];
      const { data: reviewJobs } = await supabase
        .from("jobs")
        .select("id, client_name, job_id")
        .in("id", reviewJobIds);

      const jobMap = {};
      for (const j of reviewJobs || []) jobMap[j.id] = j;

      reviewRequests = reviews.map(r => ({
        id: r.id,
        client: jobMap[r.job_id]?.client_name || "Unknown",
        jobNumber: jobMap[r.job_id]?.job_id || "—",
        jobDbId: r.job_id,
        rating: r.rating,
        reviewText: r.review_text,
        googleClicked: r.google_clicked,
        sentAt: r.sent_at,
        respondedAt: r.responded_at,
      }));
    }

    // Referrals
    const { data: referrals } = await supabase
      .from("job_referrals")
      .select("id, job_id, referrer_name, referred_name, referred_phone, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Recent automation activity (job_events + followups merged)
    const { data: recentEvents } = await supabase
      .from("job_events")
      .select("id, job_id, event_type, payload, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20);

    let recentActivity = [];
    if (recentEvents && recentEvents.length > 0) {
      const eventJobIds = [...new Set(recentEvents.map(e => e.job_id))];
      const { data: eventJobs } = await supabase
        .from("jobs")
        .select("id, client_name, job_id")
        .in("id", eventJobIds);

      const jobMap = {};
      for (const j of eventJobs || []) jobMap[j.id] = j;

      recentActivity = recentEvents.map(e => ({
        id: e.id,
        client: jobMap[e.job_id]?.client_name || "Unknown",
        jobNumber: jobMap[e.job_id]?.job_id || "—",
        eventType: e.event_type,
        payload: e.payload,
        createdAt: e.created_at,
      }));
    }

    // Stats summary
    const pendingFollowups = (followups || []).filter(f => f.status === "scheduled" || f.status === "pending").length;
    const sentFollowups = (followups || []).filter(f => f.status === "sent" || f.sent_at).length;
    const reviewsSent = (reviews || []).length;
    const reviewsReceived = (reviews || []).filter(r => r.responded_at).length;
    const avgRating = reviewsReceived > 0
      ? (reviews.filter(r => r.rating).reduce((s, r) => s + r.rating, 0) / reviews.filter(r => r.rating).length).toFixed(1)
      : null;
    const totalReferrals = (referrals || []).length;

    return res.status(200).json({
      stats: {
        pendingFollowups,
        sentFollowups,
        reviewsSent,
        reviewsReceived,
        avgRating,
        totalReferrals,
      },
      activeFollowups,
      reviewRequests,
      referrals: (referrals || []).map(r => ({
        id: r.id,
        jobDbId: r.job_id,
        referrerName: r.referrer_name,
        referredName: r.referred_name,
        referredPhone: r.referred_phone,
        status: r.status,
        createdAt: r.created_at,
      })),
      recentActivity,
    });
  } catch (err) {
    console.error("[api/campaigns] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
