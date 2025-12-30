// pages/platform/tasks/index.js

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState("open"); // "open" | "completed" | "all"

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    hasMore: false,
  });

  const [completingIds, setCompletingIds] = useState([]); // ids currently being completed

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      try {
        const res = await fetch(`/api/tasks?${params.toString()}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load tasks.");
        }

        const json = await res.json();
        if (cancelled) return;

        setTasks(json.data ?? []);
        setPagination(json.pagination ?? {});
      } catch (err) {
        console.error("[TasksPage] fetch error:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load tasks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  const handlePrevious = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    if (pagination?.hasMore) {
      setPage((p) => p + 1);
    }
  };

  // Mark a task as completed (calls /api/tasks/[id]/complete)
  const handleCompleteTask = async (taskId) => {
    if (!taskId) return;
    if (completingIds.includes(taskId)) return;

    setError(null);
    setCompletingIds((prev) => [...prev, taskId]);

    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to complete task.");
      }

      // Optimistically update local task list
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "completed",
              }
            : t
        )
      );
    } catch (err) {
      console.error("[TasksPage] complete error:", err);
      setError(err.message || "Failed to complete task.");
    } finally {
      setCompletingIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  // Client-side filter for now (we can push to DB later)
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      const status = (task.status || "").toLowerCase();

      if (statusFilter === "completed") {
        return status === "completed";
      }

      if (statusFilter === "open") {
        return status !== "completed";
      }

      // "all"
      return true;
    });
  }, [tasks, statusFilter]);

  return (
    <DashboardLayout title="Tasks">
      {/* Header */}
      <header className="mb-4 border-b border-slate-800 pb-3">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              Tasks
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              See every follow-up your AI created and make sure no hot lead
              slips through the cracks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Back to Overview */}
            <Link
              href="/platform/overview"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 shadow transition hover:border-sky-500 hover:text-sky-300 hover:shadow-[0_0_12px_rgba(56,189,248,0.45)]"
            >
              <span className="text-sm">←</span>
              <span>Back to overview</span>
            </Link>

            {/* Status filter pills */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-1 py-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setStatusFilter("open")}
                className={classNames(
                  "rounded-full px-3 py-1 transition",
                  statusFilter === "open"
                    ? "bg-sky-500/80 text-slate-50 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={classNames(
                  "rounded-full px-3 py-1 transition",
                  statusFilter === "completed"
                    ? "bg-emerald-500/80 text-slate-50 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={classNames(
                  "rounded-full px-3 py-1 transition",
                  statusFilter === "all"
                    ? "bg-slate-700 text-slate-50"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                All
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
              <h2 className="text-sm font-medium text-slate-100">
                Follow-up tasks
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {loading
                  ? "Loading tasks…"
                  : `Showing ${filteredTasks.length} tasks on page ${
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
                  <Th>Due</Th>
                  <Th>Lead</Th>
                  <Th>Contact</Th>
                  <Th>Task</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {loading && filteredTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-400 sm:px-6"
                    >
                      Loading tasks…
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-500 sm:px-6"
                    >
                      No tasks found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      isCompleting={completingIds.includes(task.id)}
                    />
                  ))
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

function TaskRow({ task, onComplete, isCompleting }) {
  const {
    id,
    leadId,
    taskType,
    title,
    description,
    priority,
    status,
    dueAt,
    leadName,
    leadEmail,
    leadPhone,
    leadSource, // <-- important for routing logic
  } = task;

  const dueDate = dueAt ? new Date(dueAt) : null;
  const now = new Date();

  const isOverdue = dueDate && dueDate < now;
  const isToday =
    dueDate &&
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getDate() === now.getDate();

  const dueLabel = dueDate
    ? dueDate.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "No date";

  const statusLabel = (status || "pending").toLowerCase();
  const isCompleted = statusLabel === "completed";

  const statusBadge = (() => {
    if (statusLabel === "completed") {
      return (
        <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">
          Completed
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span className="inline-flex rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-300">
          Overdue
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-200">
          Due today
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] text-sky-200">
        Pending
      </span>
    );
  })();

  const typeLabel = taskType || "General";
  const titleLabel = title || `${typeLabel} task`;
  const priorityBadge = priority === "high" ? "🔴" : priority === "urgent" ? "🔥" : "";

  const contactSnippet =
    leadEmail || leadPhone
      ? [leadEmail, leadPhone].filter(Boolean).join(" · ")
      : "—";

  // For now, only inbox / missed-call leads are viewable on /platform/leads/[id].
  // Cold outreach tasks use ids from cold_recipients, so linking would 404.
  const canLinkToLeadPage =
    !!leadId && leadSource !== "cold_outreach";

  const handleClickComplete = () => {
    if (!onComplete || isCompleted || isCompleting) return;
    onComplete(id);
  };

  return (
    <tr className="hover:bg-slate-900/60">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-200 sm:px-6">
        {dueLabel}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {canLinkToLeadPage ? (
          <Link
            href={`/platform/leads/${leadId}`}
            className="text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline"
          >
            {leadName || `Lead #${leadId}`}
          </Link>
        ) : (
          <span className="text-slate-400">
            {leadName ||
              (leadSource === "cold_outreach"
                ? `Cold lead #${leadId}`
                : "Unlinked lead")}
          </span>
        )}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-300 sm:px-6">
        {contactSnippet}
      </td>
      <td className="px-4 py-3 text-xs text-slate-200 sm:px-6">
        <div className="flex items-center gap-1">
          {priorityBadge && <span>{priorityBadge}</span>}
          <span className="truncate max-w-xs">{titleLabel}</span>
        </div>
        {description && (
          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
            {description}
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-200 sm:px-6">
        <span className="inline-flex rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-300">
          {typeLabel}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {statusBadge}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-300 sm:px-6">
        {leadSource || "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-6">
        {isCompleted ? (
          <span className="text-emerald-300 text-[11px]">Done</span>
        ) : (
          <button
            type="button"
            onClick={handleClickComplete}
            disabled={isCompleting}
            className={classNames(
              "rounded-lg border px-2 py-1 text-[11px] font-medium",
              isCompleting
                ? "cursor-not-allowed border-slate-700 text-slate-500 bg-slate-900"
                : "border-sky-500/70 text-sky-200 hover:border-sky-400 hover:text-sky-100 hover:bg-sky-500/10"
            )}
          >
            {isCompleting ? "Completing…" : "Complete"}
          </button>
        )}
      </td>
    </tr>
  );
}
