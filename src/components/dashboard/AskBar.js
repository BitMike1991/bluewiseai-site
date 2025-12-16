// src/components/dashboard/AskBar.js
import { useState } from "react";

export default function AskBar({ onResult }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="flex items-center rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 shadow-inner">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask BlueWise anything about your leads…"
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-3 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(37,99,235,0.9)] hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>
    </form>
  );
}
