// src/components/dashboard/BrainPalette.js
// Global Cmd+K command palette for the Brain

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Search, Sparkles, X } from "lucide-react";

const SUGGESTIONS = [
  { label: "Show my leads", q: "Show my leads" },
  { label: "Leads with no reply in 24h", q: "Which leads haven't replied in 24h?" },
  { label: "Tasks due today", q: "Show tasks due today." },
  { label: "Missed calls without follow-up", q: "Show missed calls without follow-up." },
  { label: "Draft a reply", q: "Draft a reply for my most recent lead" },
  { label: "Pipeline overview", q: "Show me my pipeline" },
  { label: "Revenue this week", q: "What's my revenue this week?" },
];

export default function BrainPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K toggle
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function submit(q) {
    const cleaned = (q || query || "").trim();
    if (!cleaned) return;
    setOpen(false);
    router.push(`/platform/ask?q=${encodeURIComponent(cleaned)}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit();
  }

  const filtered = query.trim()
    ? SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.q.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15vh] z-50 flex justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-d-border bg-d-bg shadow-2xl overflow-hidden">
          {/* Search input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-d-border px-4 py-3">
            <Sparkles className="w-5 h-5 text-d-primary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask BlueWise Brain..."
              className="flex-1 bg-transparent text-sm text-d-text placeholder:text-d-muted focus:outline-none"
            />
            <kbd className="hidden md:inline-flex items-center gap-1 rounded-lg border border-d-border bg-d-surface/60 px-2 py-1 text-xs text-d-muted">
              Esc
            </kbd>
          </form>

          {/* Suggestions */}
          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-d-muted">Press Enter to ask Brain</p>
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.q}
                  onClick={() => submit(s.q)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-d-surface/60 transition-colors group"
                >
                  <Search className="w-4 h-4 text-d-muted group-hover:text-d-primary shrink-0" />
                  <span className="text-sm text-d-text group-hover:text-d-primary">{s.label}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-d-border px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-d-muted">BlueWise Brain</span>
            <div className="flex items-center gap-2">
              <kbd className="hidden md:inline-flex items-center rounded border border-d-border bg-d-surface/60 px-1.5 py-0.5 text-xs text-d-muted">
                {"\u2318"}K
              </kbd>
              <span className="text-xs text-d-muted hidden md:inline">to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
