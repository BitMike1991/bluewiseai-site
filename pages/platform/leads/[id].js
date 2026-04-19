// pages/platform/leads/[id].js

import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";
import { useBranding } from "../../../src/components/dashboard/BrandingContext";
import { getBrandingStyles, getStatusBadgeStyle } from "../../../src/components/dashboard/brandingUtils";
import { useToast } from "../../../src/components/ui/ToastContext";
import { Pencil, Trash2, X, Check, Sparkles, MessageCircle, Info, ListTodo, Phone, Mail, FileText } from "lucide-react";

function formatDate(dateString) {
  if (!dateString) return "\u2014";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Montreal",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-d-primary/10 text-d-primary border-d-primary/40" },
  { value: "active", label: "Active", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/40" },
  { value: "in_convo", label: "In convo", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/40" },
  { value: "quoted", label: "Quoted", color: "bg-amber-500/10 text-amber-500 border-amber-500/40" },
  { value: "won", label: "Won", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/60" },
  { value: "lost", label: "Lost", color: "bg-rose-500/10 text-rose-500 border-rose-500/40" },
  { value: "dead", label: "Dead", color: "bg-d-border/60 text-d-text border-d-border/60" },
];

function StatusSelector({ status, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState("left");
  const btnRef = useRef(null);
  const current = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropdownWidth = 160; // w-40
    const spaceRight = window.innerWidth - rect.left;
    // If dropdown would overflow right edge, flip to right-align
    setAlign(spaceRight < dropdownWidth + 16 ? "right" : "left");
  }, [open]);

  return (
    <div className="relative" ref={btnRef}>
      <button
        type="button"
        onClick={() => !loading && setOpen(!open)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm shadow-black/20 transition hover:ring-2 hover:ring-d-primary/40 ${current.color} ${loading ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
      >
        {loading ? "Saving\u2026" : current.label}
        {!loading && (
          <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute top-full mt-1 z-50 w-40 max-w-[calc(100vw-2rem)] rounded-xl border border-d-border bg-d-surface shadow-xl shadow-black/60 py-1 ${align === "right" ? "right-0" : "left-0"}`}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  if (s.value !== status) onChange(s.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-d-surface transition flex items-center gap-2 ${
                  s.value === status ? "font-semibold text-d-primary" : "text-d-muted"
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full border ${s.color}`} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status)
    return <span className="px-2 py-1 rounded-full text-xs bg-d-border/60">unknown</span>;

  const colorMap = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/40",
    new: "bg-d-primary/10 text-d-primary border-d-primary/40",
    in_convo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/40",
    quoted: "bg-amber-500/10 text-amber-500 border-amber-500/40",
    won: "bg-emerald-500/15 text-emerald-500 border-emerald-500/60",
    lost: "bg-rose-500/10 text-rose-500 border-rose-500/40",
    dead: "bg-d-border/60 text-d-text border-d-border/60",
  };

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border shadow-sm shadow-black/20";

  const cls = colorMap[status] || "bg-d-border/60 text-d-text border-d-border/60";
  return <span className={`${base} ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

function getEventLabelAndDescription(event) {
  const type = (event.type || "").toLowerCase();

  if (type.includes("call")) {
    if (type.includes("miss")) {
      return {
        label: "Missed call",
        description: "Incoming call was missed. Your AI may have followed up by SMS.",
      };
    }
    if (type.includes("hangup")) {
      return { label: "Call ended", description: "Call ended. Check call log for more details." };
    }
    if (type.includes("initiated")) {
      return { label: "Call started", description: "Call was initiated via Telnyx." };
    }
    return { label: "Call event", description: type };
  }

  if (type.includes("cold") && type.includes("sent")) {
    return { label: "Cold email sent", description: "Cold outreach step was sent to this lead." };
  }

  if (type.includes("followup") && type.includes("created")) {
    return { label: "Follow-up task created", description: "Automation created a follow-up task for this lead." };
  }

  if (type.includes("ai") && type.includes("reply")) {
    return { label: "AI reply generated", description: "Your AI assistant drafted or sent a reply." };
  }

  return { label: "Event", description: type || "Lead event logged by automation." };
}

function truncateText(str, max = 900) {
  const s = (str || "").toString();
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "\u2026";
}

function classifyChannel(channelValue) {
  const s = (channelValue || "").toString().toLowerCase();

  if (s === "email" || s.includes("email") || s.includes("mailgun") || s.includes("gmail") || s.includes("smtp"))
    return "email";

  if (s === "sms" || s.includes("sms") || s.includes("telnyx") || s.includes("text")) return "sms";

  if (s === "call" || s.includes("call") || s.includes("voice") || s.includes("phone")) return "call";

  return s || "unknown";
}

function normalizeMessageBody(raw) {
  if (!raw) return "";
  let s = raw.toString();
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.trim();
  return s;
}

function splitSignaturePreview(body) {
  const s = body || "";
  if (!s) return { preview: "", hasSig: false };

  const sigRegex =
    /(\n--\s*\n|\n\u2014\s*\n|\n___+\s*\n|\nSent from my (iPhone|Android).*\n|\nBest regards,|\nRegards,|\nSincerely,|\nCordialement,|\nMerci,)/i;

  const m = s.match(sigRegex);
  if (!m || typeof m.index !== "number") return { preview: s, hasSig: false };

  const idx = m.index;
  if (idx < 40) return { preview: s, hasSig: false };

  return { preview: s.slice(0, idx).trim(), hasSig: true };
}

function TimelineItem({ item }) {
  const isMessage = item.type === "message";
  const isInbound = item.direction === "inbound";

  let title = item.label;
  let pill = null;
  let body = null;

  const [expanded, setExpanded] = useState(false);

  if (isMessage) {
    const channelClass = classifyChannel(item.channel);
    title = channelClass === "call"
      ? (isInbound ? "Inbound call transcript" : "Outbound call transcript")
      : (isInbound ? "Inbound message" : "Outbound message");

    pill = (
      <span className="uppercase tracking-wide text-[0.65rem] px-1.5 py-0.5 rounded-full bg-d-surface/80 text-d-muted">
        {channelClass}
      </span>
    );

    const normalized = normalizeMessageBody(item.body || "");

    const EMAIL_LIMIT = 900;
    const OTHER_LIMIT = 1400;
    const limit = channelClass === "email" ? EMAIL_LIMIT : OTHER_LIMIT;

    const sigSplit =
      channelClass === "email" ? splitSignaturePreview(normalized) : { preview: normalized, hasSig: false };
    const basePreview = sigSplit.preview;

    const tooLong =
      (channelClass === "email" && sigSplit.hasSig) || normalized.length > limit || basePreview.length > limit;

    const shownBody = expanded ? normalized : truncateText(basePreview, limit);

    body = (
      <div className="space-y-2">
        <p className="text-sm text-d-text whitespace-pre-line">{shownBody}</p>

        {tooLong ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-medium text-d-primary hover:text-d-primary/80"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    );
  } else {
    body = (
      <p className="text-xs text-d-muted">
        <span className="font-mono text-d-muted/90">{item.description || item.eventType}</span>
      </p>
    );
  }

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="absolute left-1 top-0 bottom-0 w-px bg-d-border/70" />
      <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-d-primary shadow-[0_0_10px_rgb(var(--d-primary-rgb)/0.8)]" />

      <div className="bg-d-surface border border-d-border rounded-xl px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-xs text-d-muted">
          <div className="flex items-center gap-2">
            <span className="font-medium text-d-text">{title}</span>
            {pill}
          </div>
          <span>{formatDate(item.at)}</span>
        </div>

        {body}
      </div>
    </div>
  );
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-d-border bg-d-bg shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between gap-3 border-b border-d-border px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-d-text">{title}</p>
              <p className="mt-1 text-xs text-d-muted">Send an outbound message and log it to the timeline.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-d-border bg-d-surface/60 px-3 py-1.5 text-[11px] font-semibold text-d-text hover:border-d-border"
            >
              Close
            </button>
          </div>

          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function NotesSection({ notes, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(notes); }, [notes]);

  const handleSave = async () => {
    if (draft === notes) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-d-text tracking-wide">Notes</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-d-primary hover:underline">
            {notes ? "Edit" : "Add note"}
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-d-border bg-d-bg px-3 py-2 text-sm text-d-text placeholder:text-d-muted/40 focus:outline-none focus:ring-2 focus:ring-d-primary/40 resize-y"
            placeholder="Add notes about this lead..."
            autoFocus
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => { setDraft(notes); setEditing(false); }} className="px-3 py-1.5 text-xs text-d-muted hover:text-d-text rounded-lg transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-semibold bg-d-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-d-muted whitespace-pre-wrap leading-relaxed">
          {notes || "No notes yet."}
        </p>
      )}
    </div>
  );
}

const EDITABLE_FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "city", label: "City", type: "text" },
  { key: "source", label: "Source", type: "select", options: ["manual", "missed_call", "cold_outreach", "email", "sms", "form", "referral", "meta_ads", "website"] },
  { key: "language", label: "Language", type: "select", options: ["", "fr", "en"] },
];

function LeadDetailsCard({ lead, leadId, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (lead) {
      setDraft({
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        city: lead.city || "",
        source: lead.source || "",
        language: lead.language || "",
      });
    }
  }, [lead]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update");
      onUpdated(draft);
      setEditing(false);
      toast.success("Lead updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      toast.success("Lead deleted");
      onDeleted();
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));
  const inputCls = "w-full rounded-lg border border-d-border bg-d-bg px-2 py-1 text-sm text-d-text focus:outline-none focus:ring-1 focus:ring-d-primary/50";

  return (
    <div className="bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-d-text tracking-wide">Lead details</h2>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} disabled={saving} className="p-1.5 rounded-lg text-d-muted hover:text-d-text hover:bg-d-surface transition" title="Cancel">
                <X className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition" title="Save">
                <Check className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-d-muted hover:text-d-primary hover:bg-d-primary/10 transition" title="Edit lead">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-d-muted hover:text-rose-500 hover:bg-rose-500/10 transition" title="Delete lead">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="mb-3 p-3 rounded-xl border border-rose-500/40 bg-rose-500/10">
          <p className="text-xs text-rose-400 mb-2">Delete this lead permanently? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 disabled:opacity-50">
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-d-border text-xs text-d-muted hover:text-d-text">Cancel</button>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-y-2 text-sm text-d-text">
        {EDITABLE_FIELDS.map(({ key, label, type, options }) => (
          <div key={key} className="flex justify-between items-center gap-4">
            <dt className="text-d-muted text-xs uppercase tracking-wide">{label}</dt>
            <dd className="font-medium text-right">
              {editing ? (
                type === "select" ? (
                  <select value={draft[key] || ""} onChange={set(key)} className={inputCls + " text-right"}>
                    {key === "language" ? (
                      <><option value="">—</option><option value="fr">Français</option><option value="en">English</option></>
                    ) : (
                      options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)
                    )}
                  </select>
                ) : (
                  <input type={type} value={draft[key] || ""} onChange={set(key)} className={inputCls + " text-right"} />
                )
              ) : (
                lead?.[key] || "\u2014"
              )}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-d-muted text-xs uppercase tracking-wide">First seen</dt>
          <dd>{formatDate(lead?.firstSeenAt || lead?.createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-d-muted text-xs uppercase tracking-wide">Last contact</dt>
          <dd>{formatDate(lead?.lastContactAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-d-muted text-xs uppercase tracking-wide">Missed calls</dt>
          <dd className="font-medium">{lead?.missed_call_count ?? 0}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { branding, enabledHubTools } = useBranding();
  const styles = getBrandingStyles(branding);
  // Always show the devis button — all leads currently flow through PUR's devis workflow
  // and the internal CRM is the primary surface even when tenant is BlueWise AI.
  const showDevisButton = true;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [timelineFilter, setTimelineFilter] = useState("all");
  const [mobileTab, setMobileTab] = useState("convo"); // convo | infos | tasks

  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState("sms");
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendHtml, setSendHtml] = useState("");
  const [sendMeta, setSendMeta] = useState({ source: "manual_ui", context: "lead_detail" });

  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [callLoading, setCallLoading] = useState(false);
  const [creatingDevis, setCreatingDevis] = useState(false);

  async function createDevisFromLead() {
    if (!id || creatingDevis) return;
    setCreatingDevis(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: Number(id) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur création');
      router.push(`/platform/jobs/${json.id}`);
    } catch (err) {
      alert(`Impossible de créer le devis : ${err.message}`);
      setCreatingDevis(false);
    }
  }
  const toast = useToast();

  async function initiateCall() {
    if (!data?.lead?.phone || callLoading) return;
    setCallLoading(true);
    try {
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadPhone: data.lead.phone }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Call failed");
      toast.success("Appel en cours — votre téléphone va sonner");
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'appel");
    } finally {
      setCallLoading(false);
    }
  }

  async function loadLead() {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${id}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load lead detail");

      const rawLead = json.lead || null;
      const inboxLead = json.inbox_lead || null;

      const rawMessages = json.messages || [];
      const rawEvents = json.events || [];
      const rawFollowups = json.tasks || json.followups || [];

      const lastContactAt =
        inboxLead?.last_contact_at ||
        rawLead?.last_message_at ||
        rawLead?.last_missed_call_at ||
        rawLead?.first_seen_at ||
        rawLead?.created_at ||
        null;

      const lead = rawLead
        ? {
            ...rawLead,
            firstSeenAt: rawLead.first_seen_at || rawLead.created_at,
            lastContactAt,
            createdAt: rawLead.created_at,
          }
        : null;

      const messageItems = rawMessages.map((m) => {
        const direction = m.direction || "outbound";
        const channelRaw = m.channel || m.message_type || "sms";
        const channel = classifyChannel(channelRaw);
        const body = m.body_text || m.body || "";

        return {
          id: `msg-${m.id}`,
          type: "message",
          direction,
          channel,
          body,
          at: m.created_at,
        };
      });

      const eventItems = rawEvents.map((e) => {
        const type = e.event_type || e.type || "";
        const { label, description } = getEventLabelAndDescription({ type });
        return {
          id: `evt-${e.id}`,
          type: "event",
          label,
          eventType: type,
          description,
          at: e.created_at,
        };
      });

      const timeline = [...messageItems, ...eventItems].sort((a, b) => {
        const da = a.at ? new Date(a.at).getTime() : 0;
        const db = b.at ? new Date(b.at).getTime() : 0;
        return db - da;
      });

      const inboundMessages = messageItems.filter((m) => m.direction === "inbound").length;
      const outboundMessages = messageItems.filter((m) => m.direction === "outbound").length;

      const stats = {
        totalMessages: messageItems.length,
        inboundMessages,
        outboundMessages,
      };

      const tasks = rawFollowups.map((f) => ({
        id: f.id,
        status: f.status || "open",
        followupType: f.followup_type || f.type || "Follow-up",
        sequenceStage: f.sequence_stage,
        dueAt: f.due_at,
        source: "automation",
      }));

      const photos = json.photos || [];
      const jobs = json.jobs || [];
      const formSubmissions = json.formSubmissions || [];

      setData({ lead, inboxLead, timeline, stats, tasks, photos, jobs, formSubmissions });
    } catch (err) {
      console.error("Lead detail fetch error", err);
      setError(err.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (!id || statusLoading) return;
    setStatusLoading(true);

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status");

      // Optimistic update
      setData((prev) => {
        if (!prev?.lead) return prev;
        return {
          ...prev,
          lead: { ...prev.lead, status: newStatus },
        };
      });
    } catch (err) {
      console.error("Status update error:", err);
      // Reload to get correct state
      await loadLead();
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    loadLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const lead = data?.lead;
  const timeline = data?.timeline || [];
  const stats = data?.stats || { totalMessages: 0, inboundMessages: 0, outboundMessages: 0 };
  const tasks = data?.tasks || [];
  const photos = data?.photos || [];
  const jobs = data?.jobs || [];
  const formSubmissions = data?.formSubmissions || [];

  const [lightboxUrl, setLightboxUrl] = useState(null);

  const openTasks = tasks.filter((t) => (t.status || "open").toLowerCase() !== "completed");
  const completedTasks = tasks.filter((t) => (t.status || "open").toLowerCase() === "completed");

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return timeline;

    if (timelineFilter === "sms" || timelineFilter === "email") {
      return timeline.filter((it) => it.type === "message" && classifyChannel(it.channel) === timelineFilter);
    }

    if (timelineFilter === "calls") {
      return timeline.filter((it) =>
        (it.type === "event" && (it.eventType || "").toLowerCase().includes("call")) ||
        (it.type === "message" && classifyChannel(it.channel) === "call")
      );
    }

    if (timelineFilter === "missed_calls") {
      return timeline.filter((it) => {
        if (it.type !== "event") return false;
        const t = (it.eventType || "").toLowerCase();
        return t.includes("call") && (t.includes("miss") || t.includes("missed"));
      });
    }

    return timeline;
  }, [timeline, timelineFilter]);

  function openSendModal(channel) {
    const ch = channel || "sms";
    setSendChannel(ch);

    const defaultTo = ch === "sms" ? lead?.phone || "" : lead?.email || "";
    setSendTo(defaultTo);

    setSendSubject(ch === "email" ? `Re: ${lead?.name || "Your request"}` : "");
    setSendBody("");
    setSendHtml("");
    setSendMeta({ source: "manual_ui", context: "lead_detail", lead_id: Number(id) });

    setSendError(null);
    setSendSuccess(null);
    setSendOpen(true);
  }

  async function submitSend() {
    if (!lead?.id) return;

    setSendLoading(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const payload = {
        lead_id: Number(lead.id),
        channel: sendChannel,
        to: (sendTo || "").trim(),
        subject: sendChannel === "email" ? (sendSubject || "").trim() : undefined,
        body: (sendBody || "").trim(),
        html: sendChannel === "email" && sendHtml.trim() ? sendHtml : undefined,
        meta: sendMeta && typeof sendMeta === "object" ? sendMeta : undefined,
      };

      if (!payload.to) throw new Error("Recipient is required");
      if (!payload.body) throw new Error("Message body is required");
      if (sendChannel === "email" && !payload.subject) throw new Error("Subject is required for email");

      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || `Send failed (${res.status})`);

      if (!json.success) {
        throw new Error(json.error || "Send failed");
      }

      setSendSuccess({
        provider: json.provider,
        provider_message_id: json.provider_message_id,
        message_id: json.message_id,
        created_at: json.created_at,
      });

      await loadLead();
    } catch (e) {
      setSendError(e?.message || "Failed to send");
    } finally {
      setSendLoading(false);
    }
  }

  return (
    <DashboardLayout title="Lead details">
      {/* Photo Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Photo"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
          >
            \u2715
          </button>
        </div>
      )}
      <div className="h-full w-full px-4 sm:px-6 py-0 sm:py-6 text-d-text pb-40 lg:pb-6">
        {/* Sticky header on mobile — name + status always visible */}
        <div
          className="sticky top-0 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-d-bg/95 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none sm:mb-6 border-b border-d-border/40 sm:border-0"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-d-primary/15 border border-d-primary/40 shadow-[0_0_20px_rgb(var(--d-primary-rgb)/0.5)]">
                <span className="text-sm font-semibold text-d-primary">
                  {lead?.name?.[0]?.toUpperCase() || lead?.phone?.slice(-2) || lead?.email?.[0]?.toUpperCase() || "L"}
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-[15px] sm:text-xl font-semibold text-d-text tracking-tight truncate leading-tight">
                  {lead?.name || lead?.phone || lead?.email || "Lead"}
                </h1>
                <p className="text-[11px] sm:text-xs text-d-muted truncate">
                  {lead?.source ? `Source: ${lead.source}` : "Captured by your automations"}
                </p>
              </div>
              {/* Status pill on mobile — inline with header */}
              <div className="sm:hidden shrink-0">
                {lead && (
                  <StatusSelector
                    status={lead.status || "new"}
                    onChange={handleStatusChange}
                    loading={statusLoading}
                  />
                )}
              </div>
            </div>

            <div className="hidden sm:flex sm:flex-col sm:items-end gap-2">
              {lead && (
                <StatusSelector
                  status={lead.status || "new"}
                  onChange={handleStatusChange}
                  loading={statusLoading}
                />
              )}
              <p className="text-xs text-d-muted">
                Last contact: <span className="text-d-text">{formatDate(lead?.lastContactAt)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile tabs — sticky below header */}
        <div className="lg:hidden sticky top-[68px] z-20 -mx-4 px-2 bg-d-bg/95 backdrop-blur-md border-b border-d-border/40 mb-4">
          <div className="flex gap-1" style={{ touchAction: "manipulation" }}>
            {[
              { key: "convo", label: "Conversation", icon: MessageCircle, badge: stats.totalMessages },
              { key: "infos", label: "Infos", icon: Info },
              { key: "tasks", label: "Tasks", icon: ListTodo, badge: openTasks.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = mobileTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setMobileTab(tab.key)}
                  className={cx(
                    "flex-1 flex items-center justify-center gap-1.5 min-h-[48px] py-3 px-2 text-xs font-semibold border-b-2 transition-all duration-200 active:bg-d-surface/40",
                    active
                      ? "text-d-primary border-d-primary"
                      : "text-d-muted border-transparent"
                  )}
                  style={{ touchAction: "manipulation" }}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge ? (
                    <span className={cx(
                      "ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold shrink-0",
                      active ? "bg-d-primary text-white" : "bg-d-border/50 text-d-muted"
                    )}>{tab.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div className={cx(
            "bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40",
            mobileTab === "convo" ? "block" : "hidden lg:block"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-d-text tracking-wide">Conversation timeline</h2>
                <p className="text-xs text-d-muted hidden sm:block">
                  All activity related to this lead (messages, calls, cold outreach events).
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                  className="rounded-xl border border-d-border bg-d-surface px-3 py-2 text-xs text-d-text focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60 min-h-[44px] sm:min-h-0"
                >
                  <option value="all">All</option>
                  <option value="sms">SMS only</option>
                  <option value="email">Email only</option>
                  <option value="calls">Calls only</option>
                  <option value="missed_calls">Missed calls only</option>
                </select>

                <div className="flex items-center gap-3 text-xs text-d-muted">
                  <span>
                    In: <span className="text-d-text">{stats.inboundMessages}</span>
                  </span>
                  <span>
                    Out: <span className="text-d-text">{stats.outboundMessages}</span>
                  </span>
                </div>
              </div>
            </div>

            {loading && <p className="text-sm text-d-muted">Loading timeline\u2026</p>}
            {error && !loading && <p className="text-sm text-rose-500">{error}</p>}

            {!loading && !error && filteredTimeline.length === 0 && (
              <p className="text-sm text-d-muted">No items match this filter yet.</p>
            )}

            {!loading && !error && filteredTimeline.length > 0 && (
              <div className="mt-2">
                {filteredTimeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <div className={cx(
            "space-y-4",
            (mobileTab === "infos" || mobileTab === "tasks") ? "block" : "hidden lg:block"
          )}>
            {/* Quick actions — desktop only (mobile uses sticky bottom bar) */}
            <div className={cx(
              "bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40",
              "hidden lg:block"
            )}>
              <h2 className="text-sm font-semibold text-d-text mb-3 tracking-wide">Quick actions</h2>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openSendModal("sms")}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium shadow-[0_0_18px_rgb(var(--d-primary-rgb)/0.55)] transition",
                    lead?.phone
                      ? "bg-d-primary/90 hover:bg-d-primary/80 text-white"
                      : "bg-d-surface text-d-muted cursor-not-allowed"
                  )}
                  disabled={!lead?.phone}
                  title={!lead?.phone ? "Lead has no phone number" : "Send SMS"}
                >
                  Send SMS reply
                </button>

                <button
                  type="button"
                  onClick={() => openSendModal("email")}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition",
                    lead?.email
                      ? "bg-d-surface hover:bg-d-surface/80 text-d-text border-d-border/70"
                      : "bg-d-surface text-d-text0 border-d-border cursor-not-allowed"
                  )}
                  disabled={!lead?.email}
                  title={!lead?.email ? "Lead has no email" : "Send email"}
                >
                  Send email
                </button>

                <button
                  type="button"
                  onClick={initiateCall}
                  className={cx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition",
                    lead?.phone && !callLoading
                      ? "bg-green-600/80 hover:bg-green-600/70 text-white border-green-500/50"
                      : "bg-d-surface text-d-muted border-d-border cursor-not-allowed"
                  )}
                  disabled={!lead?.phone || callLoading}
                  title={!lead?.phone ? "Lead has no phone number" : "Call via Groundwire"}
                >
                  {callLoading ? "Appel en cours..." : "Appeler"}
                </button>

                {showDevisButton && id && (
                  <button
                    type="button"
                    disabled={creatingDevis}
                    onClick={createDevisFromLead}
                    aria-label="Créer un devis pour ce lead"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-d-primary/50 bg-d-primary/10 text-d-primary hover:bg-d-primary/20 disabled:opacity-60 disabled:cursor-wait transition focus:outline-none focus:ring-2 focus:ring-d-primary/50"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    {creatingDevis ? 'Création...' : 'Créer un devis'}
                  </button>
                )}

              </div>
            </div>

            {/* INFO SECTIONS — visible when mobileTab=infos OR on desktop */}
            <div className={cx(
              "space-y-4",
              mobileTab === "infos" ? "block" : "hidden lg:block"
            )}>
            {/* Form submissions (Facebook lead ads, web forms) */}
            {formSubmissions.length > 0 && (
              <div className="bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40">
                <h2 className="text-sm font-semibold text-d-text mb-3 tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-d-primary" />
                  Form submission
                </h2>
                {formSubmissions.map((sub) => {
                  const FIELD_LABELS = {
                    name: "Name",
                    full_name: "Name",
                    phone: "Phone",
                    email: "Email",
                    city: "City",
                    custom_windows: "Number of windows",
                    project_type: "Project type",
                    what_project: "Project type",
                    type_de_projet: "Type de projet",
                  };
                  const label = (key) => FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const entries = Object.entries(sub.answers || {}).filter(([k, v]) => v != null && v !== "");
                  return (
                    <div key={sub.id} className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-d-muted">
                        {sub.event_type === "facebook_lead_received" ? "Facebook Lead Ad" : "Web form"}
                        {" · "}
                        {formatDate(sub.submitted_at)}
                      </p>
                      <dl className="grid grid-cols-1 gap-y-1.5 text-sm text-d-text">
                        {entries.map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-4">
                            <dt className="text-d-muted text-xs uppercase tracking-wide">{label(key)}</dt>
                            <dd className="font-medium text-right break-words max-w-[60%]">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <div className="bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40">
                <h2 className="text-sm font-semibold text-d-text mb-3 tracking-wide">
                  Photos ({photos.length})
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setLightboxUrl(photo.file_url)}
                      className="aspect-square rounded-lg overflow-hidden border border-d-border/60 hover:border-d-primary/60 transition group"
                    >
                      <img
                        src={photo.file_url}
                        alt="Lead photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <LeadDetailsCard lead={lead} leadId={id} onUpdated={(updated) => {
              setData((prev) => prev ? { ...prev, lead: { ...prev.lead, ...updated } } : prev);
            }} onDeleted={() => router.push("/platform/leads")} />

            {/* Notes */}
            <NotesSection
              notes={lead?.notes || ""}
              onSave={async (notes) => {
                const res = await fetch(`/api/leads/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes }),
                });
                if (!res.ok) throw new Error("Failed to save notes");
                setData((prev) => prev ? { ...prev, lead: { ...prev.lead, notes } } : prev);
              }}
            />

            {/* Linked Jobs */}
            {jobs.length > 0 && (
              <div className="bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40">
                <h2 className="text-sm font-semibold text-d-text mb-3 tracking-wide">
                  Jobs ({jobs.length})
                </h2>
                <ul className="space-y-2">
                  {jobs.map((job) => (
                    <li key={job.id}>
                      <Link
                        href={`/platform/jobs/${job.id}`}
                        className="flex items-center justify-between rounded-xl border border-d-border bg-d-surface px-3 py-2 hover:border-d-primary/40 transition"
                      >
                        <div className="flex flex-col text-xs">
                          <span className="font-mono text-d-primary">{job.job_id}</span>
                          <span className="text-d-muted">
                            {(job.project_type || "N/A").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={cx(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                            job.status === "completed" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" :
                            job.status === "signed" || job.status === "scheduled" ? "bg-d-primary/15 text-d-primary border-d-primary/40" :
                            job.status === "cancelled" ? "bg-rose-500/10 text-rose-500 border-rose-500/40" :
                            "bg-d-border/60 text-d-text border-d-border/40"
                          )}>
                            {(job.status || "draft").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          {job.quote_amount && (
                            <p className="text-[10px] text-d-text0 mt-0.5">
                              {new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(job.quote_amount)}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
            {/* END info sections */}

            <div className={cx(
              "bg-d-surface border border-d-border rounded-2xl p-5 shadow-xl shadow-black/40",
              mobileTab === "tasks" ? "block" : "hidden lg:block"
            )}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-d-text tracking-wide">Follow-up tasks</h2>
                <div className="flex items-center gap-2 text-[11px] text-d-muted">
                  <span>
                    Open: <span className="text-d-primary">{openTasks.length}</span>
                  </span>
                  <span>
                    Completed: <span className="text-emerald-500">{completedTasks.length}</span>
                  </span>
                </div>
              </div>

              {loading && <p className="text-xs text-d-muted">Loading tasks\u2026</p>}

              {!loading && tasks.length === 0 && (
                <p className="text-xs text-d-muted">
                  No follow-up tasks yet for this lead. When your AI creates follow-ups, they'll appear here.
                </p>
              )}

              {!loading && tasks.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {tasks.map((task) => {
                    const statusLabel = (task.status || "open").toLowerCase();
                    const isCompleted = statusLabel === "completed";
                    const dueText = task.dueAt ? formatDate(task.dueAt) : "No due date";
                    const stageLabel =
                      typeof task.sequenceStage === "number" ? `Step ${task.sequenceStage}` : "\u2014";

                    const badge = isCompleted ? (
                      <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-500">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-d-primary/20 px-2 py-0.5 text-[10px] text-d-primary">
                        Open
                      </span>
                    );

                    return (
                      <li
                        key={task.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-d-border bg-d-surface px-3 py-2"
                      >
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-d-text">{task.followupType || "Follow-up"}</span>
                          <span className="text-d-muted">
                            {stageLabel} \u00b7 {dueText}
                          </span>
                          <span className="text-d-text0">Source: {task.source || "unknown"}</span>
                        </div>
                        <div className="mt-0.5">{badge}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Spacer to ensure last content clears bottom bar on mobile */}
        <div className="h-32 lg:hidden" aria-hidden="true" style={{ marginBottom: "env(safe-area-inset-bottom)" }} />

        {/* Sticky bottom action bar — mobile only, safe-area aware */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-d-bg/95 backdrop-blur-md border-t border-d-border/60 px-3 pt-2 flex items-center gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", touchAction: "manipulation" }}
        >
          <button
            type="button"
            onClick={initiateCall}
            disabled={!lead?.phone || callLoading}
            className={cx(
              "flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95",
              lead?.phone && !callLoading
                ? "bg-green-600/90 text-white shadow-md shadow-green-900/30 hover:bg-green-600"
                : "bg-d-surface text-d-muted opacity-50"
            )}
            style={{ touchAction: "manipulation" }}
            aria-label="Call lead"
          >
            <Phone className="w-5 h-5" />
            <span>{callLoading ? "..." : "Call"}</span>
          </button>
          <button
            type="button"
            onClick={() => openSendModal("sms")}
            disabled={!lead?.phone}
            className={cx(
              "flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95",
              lead?.phone
                ? "bg-d-primary text-white shadow-md shadow-d-primary/30 hover:opacity-90"
                : "bg-d-surface text-d-muted opacity-50"
            )}
            style={{ touchAction: "manipulation" }}
            aria-label="Send SMS"
          >
            <MessageCircle className="w-5 h-5" />
            <span>SMS</span>
          </button>
          <button
            type="button"
            onClick={() => openSendModal("email")}
            disabled={!lead?.email}
            className={cx(
              "flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95 border",
              lead?.email
                ? "bg-d-surface border-d-border text-d-text hover:border-d-primary"
                : "bg-d-surface border-d-border text-d-muted opacity-50"
            )}
            style={{ touchAction: "manipulation" }}
            aria-label="Send email"
          >
            <Mail className="w-5 h-5" />
            <span>Email</span>
          </button>
          {showDevisButton && id && (
            <button
              type="button"
              disabled={creatingDevis}
              onClick={createDevisFromLead}
              aria-label="Créer un devis pour ce lead"
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95 border border-d-primary/40 bg-d-primary/10 text-d-primary disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-d-primary/50"
              style={{ touchAction: "manipulation" }}
            >
              <FileText className="w-5 h-5" aria-hidden="true" />
              <span>{creatingDevis ? '...' : 'Devis'}</span>
            </button>
          )}
        </div>

        {/* Send Modal */}
        <Modal
          open={sendOpen}
          title={`Send ${sendChannel === "sms" ? "SMS" : "Email"} to ${lead?.name || "lead"}`}
          onClose={() => {
            if (sendLoading) return;
            setSendOpen(false);
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSendChannel("sms")}
              className={cx(
                "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                sendChannel === "sms"
                  ? "border-d-primary/60 bg-d-primary/10 text-d-primary"
                  : "border-d-border bg-d-surface/60 text-d-muted hover:border-d-primary/40"
              )}
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => setSendChannel("email")}
              className={cx(
                "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                sendChannel === "email"
                  ? "border-d-primary/60 bg-d-primary/10 text-d-primary"
                  : "border-d-border bg-d-surface/60 text-d-muted hover:border-d-primary/40"
              )}
            >
              Email
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-d-muted mb-1">To</label>
              <input
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder={sendChannel === "sms" ? "+1..." : "name@email.com"}
                className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-text0 focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60"
              />
              <p className="mt-1 text-[11px] text-d-text0">
                Default is the lead's phone/email. You can override if needed.
              </p>
            </div>

            {sendChannel === "email" ? (
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Subject</label>
                <input
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Subject..."
                  className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-text0 focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-[11px] font-semibold text-d-muted mb-1">
                Message {sendChannel === "sms" ? "(text)" : "(text body)"}
              </label>
              <textarea
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                rows={sendChannel === "sms" ? 5 : 7}
                placeholder={sendChannel === "sms" ? "Write your SMS..." : "Write your email..."}
                className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-sm text-d-text placeholder:text-d-text0 focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60"
              />
              {sendChannel === "sms" ? (
                <p className="mt-1 text-[11px] text-d-text0">
                  Keep it concise. (Server hard cap enforced.)
                </p>
              ) : null}
            </div>

            {sendChannel === "email" ? (
              <div>
                <label className="block text-[11px] font-semibold text-d-muted mb-1">Optional HTML</label>
                <textarea
                  value={sendHtml}
                  onChange={(e) => setSendHtml(e.target.value)}
                  rows={4}
                  placeholder="<p>Optional HTML version...</p>"
                  className="w-full rounded-xl border border-d-border bg-d-surface px-3 py-2 text-xs font-mono text-d-text placeholder:text-d-text0 focus:outline-none focus:ring-2 focus:ring-d-primary/50 focus:border-d-primary/60"
                />
                <p className="mt-1 text-[11px] text-d-text0">
                  If provided, Mailgun will send both HTML + Text.
                </p>
              </div>
            ) : null}

            {sendError ? <p className="text-xs text-rose-500">{sendError}</p> : null}

            {sendSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold text-emerald-500">Sent successfully</p>
                <p className="mt-1 text-[11px] text-emerald-500/80">
                  Provider: {sendSuccess.provider} \u00b7 Message ID: {sendSuccess.message_id}
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSendOpen(false)}
                disabled={sendLoading}
                className="rounded-xl border border-d-border bg-d-surface/60 px-4 py-2 text-[11px] font-semibold text-d-text hover:border-d-border disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSend}
                disabled={sendLoading}
                className="rounded-xl bg-d-primary px-4 py-2 text-[11px] font-semibold text-white shadow shadow-d-primary/40 hover:bg-d-primary/80 disabled:opacity-60"
              >
                {sendLoading ? "Sending\u2026" : "Send"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
