// src/components/brain/ContextPanel.js
// Right-side context panel showing active lead info

import { ChevronRight, Mail, MessageSquare, Phone, Calendar, X } from "lucide-react";
import Link from "next/link";

const AVATAR_COLORS = [
  "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

function avatarColor(name) {
  let hash = 0;
  const s = (name || "?").toString();
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function avatarInitials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = now - then;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

export default function ContextPanel({ lead, collapsed, onToggle, onAction }) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="hidden md:flex items-center justify-center w-10 h-full border-l border-d-border bg-d-bg hover:bg-d-surface/60 transition-colors"
        title="Show context"
      >
        <ChevronRight className="w-4 h-4 text-d-muted rotate-180" />
      </button>
    );
  }

  return (
    <div className="hidden md:flex flex-col w-80 border-l border-d-border bg-d-bg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-d-border">
        <span className="text-xs font-semibold text-d-muted uppercase tracking-wide">Context</span>
        <button onClick={onToggle} className="text-d-muted hover:text-d-text">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!lead ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-d-muted">Ask about a lead to see details here</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Lead header */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${avatarColor(lead.name)}`}>
              {avatarInitials(lead.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-d-text truncate">{lead.name || "Unknown"}</p>
              <p className="text-xs text-d-muted">{lead.status || "new"}{lead.source ? ` \u00b7 ${lead.source}` : ""}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            {lead.lastContactAt && (
              <div className="rounded-lg bg-d-surface/60 border border-d-border p-2.5">
                <p className="text-xs text-d-muted">Last contact</p>
                <p className="text-sm font-semibold text-d-text">{formatTimeAgo(lead.lastContactAt)}</p>
              </div>
            )}
            {lead.messageCount != null && (
              <div className="rounded-lg bg-d-surface/60 border border-d-border p-2.5">
                <p className="text-xs text-d-muted">Messages</p>
                <p className="text-sm font-semibold text-d-text">{lead.messageCount}</p>
              </div>
            )}
            {lead.missedCallCount > 0 && (
              <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-2.5">
                <p className="text-xs text-rose-500">Missed calls</p>
                <p className="text-sm font-semibold text-rose-500">{lead.missedCallCount}</p>
              </div>
            )}
            {lead.createdAt && (
              <div className="rounded-lg bg-d-surface/60 border border-d-border p-2.5">
                <p className="text-xs text-d-muted">Lead age</p>
                <p className="text-sm font-semibold text-d-text">{formatTimeAgo(lead.createdAt)}</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-d-muted uppercase tracking-wide">Quick Actions</p>
            {lead.phone && (
              <button
                onClick={() => onAction?.("sms", lead)}
                className="w-full flex items-center gap-2 rounded-lg border border-d-border bg-d-surface/60 px-3 py-2.5 text-sm text-d-text hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[44px] md:min-h-0"
              >
                <MessageSquare className="w-4 h-4" /> SMS
              </button>
            )}
            {lead.email && (
              <button
                onClick={() => onAction?.("email", lead)}
                className="w-full flex items-center gap-2 rounded-lg border border-d-border bg-d-surface/60 px-3 py-2.5 text-sm text-d-text hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[44px] md:min-h-0"
              >
                <Mail className="w-4 h-4" /> Email
              </button>
            )}
            <button
              onClick={() => onAction?.("task", lead)}
              className="w-full flex items-center gap-2 rounded-lg border border-d-border bg-d-surface/60 px-3 py-2.5 text-sm text-d-text hover:border-d-primary/40 hover:text-d-primary transition-colors min-h-[44px] md:min-h-0"
            >
              <Calendar className="w-4 h-4" /> Create Task
            </button>
            {lead.leadId && (
              <Link
                href={`/platform/leads/${lead.leadId}`}
                className="w-full flex items-center gap-2 rounded-lg border border-d-primary/40 bg-d-primary/5 px-3 py-2.5 text-sm font-semibold text-d-primary hover:bg-d-primary/10 transition-colors min-h-[44px] md:min-h-0"
              >
                View Profile <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
