// src/components/dashboard/AskBar.js
import { useState } from "react";
import { useBranding } from "./BrandingContext";
import { getBrandingStyles } from "./brandingUtils";

export default function AskBar({ onResult }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const { branding } = useBranding();
  const styles = getBrandingStyles(branding);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      onResult?.(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div
        className="flex items-center rounded-2xl border border-d-border bg-d-surface px-4 py-2 shadow-inner"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your leads…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-3 rounded-xl bg-d-primary text-white px-4 py-1.5 text-xs font-semibold shadow-lg disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>
    </form>
  );
}
