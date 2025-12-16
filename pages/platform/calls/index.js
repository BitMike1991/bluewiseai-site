// pages/platform/calls/index.js

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchCalls() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (outcomeFilter !== "all") {
        params.set("outcome", outcomeFilter);
      }

      try {
        const res = await fetch(`/api/calls?${params.toString()}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load calls.");
        }

        const json = await res.json();
        if (cancelled) return;

        setCalls(json.data ?? []);
        setPagination(json.pagination ?? {});
      } catch (err) {
        console.error("[CallsPage] fetch error:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load calls.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCalls();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, outcomeFilter]);

  const handlePrevious = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    if (pagination?.hasMore) {
      setPage((p) => p + 1);
    }
  };

  return (
    <DashboardLayout title="Calls">
      {/* Header */}
      <header className="mb-4 border-b border-slate-800 pb-3">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              Calls
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              See every inbound and outbound call, track missed calls, and
              confirm whether your AI followed up.
            </p>
          </div>

          {/* RIGHT SIDE: Back button + Filter pills */}
          <div className="flex items-center gap-3">
            {/* Back to Overview */}
            <Link
              href="/platform/overview"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 shadow transition hover:border-sky-500 hover:text-sky-300 hover:shadow-[0_0_12px_rgba(56,189,248,0.45)]"
            >
              <span className="text-sm">←</span>
              <span>Back to overview</span>
            </Link>

            {/* Simple filter pill group */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-1 py-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setOutcomeFilter("all");
                }}
                className={classNames(
                  "rounded-full px-3 py-1 transition",
                  outcomeFilter === "all"
                    ? "bg-sky-500/80 text-slate-50 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setOutcomeFilter("missed");
                }}
                className={classNames(
                  "rounded-full px-3 py-1 transition",
                  outcomeFilter === "missed"
                    ? "bg-rose-500/80 text-slate-50 shadow-[0_0_12px_rgba(244,63,94,0.7)]"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                Missed
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setOutcomeFilter("answered");
                }}
                className={classNames(
                  "rounded-full px-3 py-1 transition",
                  outcomeFilter === "answered"
                    ? "bg-emerald-500/80 text-slate-50 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                Answered
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex w-full flex-1 flex-col gap-4">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-sky-500/10">
          {/* Table header row */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-sm font-medium text-slate-100">Call log</h2>
              <p className="mt-1 text-xs text-slate-400">
                {loading
                  ? "Loading calls…"
                  : `Showing ${calls.length} calls on page ${
                      pagination?.page ?? 1
                    }${
                      pagination?.total
                        ? ` of ${pagination.total} total`
                        : ""
                    }.`}
              </p>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={page <= 1 || loading}
                className={classNames(
                  "rounded-lg border px-3 py-1 text-xs sm:text-sm",
                  page <= 1 || loading
                    ? "cursor-not-allowed border-slate-700 text-slate-500"
                    : "border-slate-600 text-slate-100 hover:border-sky-500 hover:text-sky-300"
                )}
              >
                Previous
              </button>
              <span className="text-xs text-slate-400 sm:text-sm">
                Page {pagination?.page ?? page}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!pagination?.hasMore || loading}
                className={classNames(
                  "rounded-lg border px-3 py-1 text-xs sm:text-sm",
                  !pagination?.hasMore || loading
                    ? "cursor-not-allowed border-slate-700 text-slate-500"
                    : "border-slate-600 text-slate-100 hover:border-sky-500 hover:text-sky-300"
                )}
              >
                Next
              </button>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="border-b border-slate-800 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 sm:px-6">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-xs sm:text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <Th>Date / Time</Th>
                  <Th>Direction</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Outcome</Th>
                  <Th>AI Follow-up</Th>
                  <Th>Duration</Th>
                  <Th>Lead</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {loading && calls.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-400 sm:px-6"
                    >
                      Loading calls…
                    </td>
                  </tr>
                ) : calls.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-500 sm:px-6"
                    >
                      No calls found for this filter.
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => <CallRow key={call.id} call={call} />)
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

function Th({ children }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6"
    >
      {children}
    </th>
  );
}

function CallRow({ call }) {
  const {
    time,
    direction,
    outcome,
    fromNumber,
    toNumber,
    answeredByAi,
    durationSeconds,
    leadId,
  } = call;

  const dateLabel = time
    ? new Date(time).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

  const outcomeBadge = (() => {
    const label = (outcome || "").toString().toLowerCase();

    if (!label) {
      return (
        <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
          Unknown
        </span>
      );
    }

    if (label.includes("miss")) {
      return (
        <span className="inline-flex rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-300">
          Missed
        </span>
      );
    }

    if (
      label.includes("answer") ||
      label.includes("completed") ||
      label.includes("success")
    ) {
      return (
        <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">
          Answered
        </span>
      );
    }

    if (label.includes("voicemail")) {
      return (
        <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-200">
          Voicemail
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
        {outcome}
      </span>
    );
  })();

  const directionBadge = (() => {
    const label = (direction || "").toString().toLowerCase();

    if (!label) {
      return (
        <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
          —
        </span>
      );
    }

    if (label.includes("in")) {
      return (
        <span className="inline-flex rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] text-sky-300">
          Inbound
        </span>
      );
    }

    if (label.includes("out")) {
      return (
        <span className="inline-flex rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[11px] text-fuchsia-200">
          Outbound
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
        {direction}
      </span>
    );
  })();

  const aiBadge = answeredByAi ? (
    <span className="inline-flex rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] text-sky-200">
      Yes
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
      No
    </span>
  );

  const durationLabel = (() => {
    if (!durationSeconds || isNaN(durationSeconds)) return "—";
    const total = Math.max(0, Math.floor(durationSeconds));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  })();

  return (
    <tr className="hover:bg-slate-900/60">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-200 sm:px-6">
        {dateLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {directionBadge}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-200 sm:px-6">
        {fromNumber || "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-200 sm:px-6">
        {toNumber || "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {outcomeBadge}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {aiBadge}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-200 sm:px-6">
        {durationLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {leadId ? (
          <Link
            href={`/platform/leads/${leadId}`}
            className="text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline"
          >
            View lead
          </Link>
        ) : (
          <span className="text-slate-500">Unlinked</span>
        )}
      </td>
    </tr>
  );
}
