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
        className="flex items-center rounded-2xl border px-4 py-2 shadow-inner"
        style={{ backgroundColor: styles.card.backgroundColor, borderColor: styles.card.borderColor }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your leads…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: styles.text.primary }}
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-3 rounded-xl px-4 py-1.5 text-xs font-semibold shadow-lg disabled:opacity-50"
          style={{ backgroundColor: styles.button.backgroundColor, color: styles.button.color, boxShadow: `0 0 16px ${styles.colors.primary}90` }}
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>
    </form>
  );
}
