// pages/platform/tasks/index.js — Kanban Board
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";
import { Flame, Plus, GripVertical, X, Clock, User, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const BOARDS = [
  { id: "fire", label: "FIRE", emoji: null, color: "bg-red-500/20 border-red-500/40", headerBg: "bg-red-500/10", textColor: "text-red-400", max: 3, icon: Flame },
  { id: "this_week", label: "This Week", emoji: null, color: "bg-amber-500/20 border-amber-500/40", headerBg: "bg-amber-500/10", textColor: "text-amber-400", icon: Clock },
  { id: "backlog", label: "Backlog", emoji: null, color: "bg-d-border/40 border-d-border", headerBg: "bg-d-surface", textColor: "text-d-muted" },
  { id: "waiting_on", label: "Waiting On", emoji: null, color: "bg-blue-500/20 border-blue-500/40", headerBg: "bg-blue-500/10", textColor: "text-blue-400" },
  { id: "done", label: "Done", emoji: null, color: "bg-emerald-500/20 border-emerald-500/40", headerBg: "bg-emerald-500/10", textColor: "text-emerald-400", icon: CheckCircle2 },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(null); // board id to show create form in
  const [editingTask, setEditingTask] = useState(null);
  const [dragTask, setDragTask] = useState(null);
  const [dragOverBoard, setDragOverBoard] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?pageSize=100");
      if (!res.ok) throw new Error("Failed to load tasks");
      const json = await res.json();
      setTasks(json.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (data) => {
    setError(null);
    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create");
      await fetchTasks();
      setShowCreate(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTask = async (id, data) => {
    setError(null);
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    try {
      const res = await fetch(`/api/tasks/${id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        await fetchTasks(); // revert
        throw new Error(json.error || "Failed to update");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (id) => {
    setError(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}/delete`, { method: "DELETE" });
      if (!res.ok) {
        await fetchTasks();
        throw new Error("Failed to delete");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragStart = (task) => setDragTask(task);
  const handleDragOver = (e, boardId) => { e.preventDefault(); setDragOverBoard(boardId); };
  const handleDragLeave = () => setDragOverBoard(null);
  const handleDrop = (boardId) => {
    if (dragTask && dragTask.board !== boardId) {
      updateTask(dragTask.id, { board: boardId });
    }
    setDragTask(null);
    setDragOverBoard(null);
  };

  const groupedTasks = BOARDS.reduce((acc, b) => {
    acc[b.id] = tasks.filter((t) => (t.board || "backlog") === b.id);
    return acc;
  }, {});

  return (
    <DashboardLayout title="Tasks">
      <header className="mb-4 border-b border-d-border pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Tasks</h1>
            <p className="text-xs text-d-muted sm:text-sm">
              Drag tasks between columns. FIRE = max 3, do these today.
            </p>
          </div>
          <button
            onClick={() => setShowCreate("backlog")}
            className="flex items-center gap-1.5 rounded-lg bg-d-primary px-3 py-2 text-xs font-medium text-white hover:bg-d-primary/80 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Task
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-d-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {BOARDS.map((board) => (
            <KanbanColumn
              key={board.id}
              board={board}
              tasks={groupedTasks[board.id] || []}
              isDragOver={dragOverBoard === board.id}
              onDragOver={(e) => handleDragOver(e, board.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(board.id)}
              onDragStart={handleDragStart}
              onUpdate={updateTask}
              onDelete={deleteTask}
              showCreate={showCreate === board.id}
              onShowCreate={() => setShowCreate(board.id)}
              onCancelCreate={() => setShowCreate(null)}
              onCreate={(data) => createTask({ ...data, board: board.id })}
              editingTask={editingTask}
              onEdit={setEditingTask}
              onCancelEdit={() => setEditingTask(null)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function KanbanColumn({ board, tasks, isDragOver, onDragOver, onDragLeave, onDrop, onDragStart, onUpdate, onDelete, showCreate, onShowCreate, onCancelCreate, onCreate, editingTask, onEdit, onCancelEdit }) {
  const Icon = board.icon;
  return (
    <div
      className={`flex-shrink-0 w-64 sm:w-72 flex flex-col rounded-xl border transition-colors ${isDragOver ? "border-d-primary bg-d-primary/5" : "border-d-border/60 bg-d-bg"}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${board.headerBg}`}>
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={`w-3.5 h-3.5 ${board.textColor}`} />}
          <span className={`text-xs font-semibold uppercase tracking-wider ${board.textColor}`}>
            {board.label}
          </span>
          <span className="ml-1 rounded-full bg-d-border/60 px-1.5 py-0.5 text-[10px] text-d-muted">
            {tasks.length}{board.max ? `/${board.max}` : ""}
          </span>
        </div>
        <button onClick={onShowCreate} className="text-d-muted hover:text-d-text transition">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {showCreate && (
          <CreateTaskCard
            onCancel={onCancelCreate}
            onCreate={onCreate}
            boardId={board.id}
          />
        )}

        {tasks.map((task) => (
          editingTask === task.id ? (
            <EditTaskCard
              key={task.id}
              task={task}
              onSave={(data) => { onUpdate(task.id, data); onCancelEdit(); }}
              onCancel={onCancelEdit}
              onDelete={() => { onDelete(task.id); onCancelEdit(); }}
            />
          ) : (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={() => onDragStart(task)}
              onEdit={() => onEdit(task.id)}
              onComplete={() => onUpdate(task.id, { board: "done" })}
            />
          )
        ))}

        {tasks.length === 0 && !showCreate && (
          <div className="py-8 text-center text-[11px] text-d-muted/50">
            {board.id === "fire" ? "What kills the business if you skip it?" : "Drop tasks here"}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onDragStart, onEdit, onComplete }) {
  const priorityColors = {
    urgent: "border-l-red-500",
    high: "border-l-amber-500",
    normal: "border-l-transparent",
  };

  const dueDate = task.dueAt ? new Date(task.dueAt) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.board !== "done";
  const isToday = dueDate && dueDate.toDateString() === new Date().toDateString();

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onEdit}
      className={`group cursor-pointer rounded-lg border border-d-border/60 bg-d-surface p-3 transition hover:border-d-primary/40 hover:shadow-md border-l-2 ${priorityColors[task.priority] || priorityColors.normal}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-d-text leading-snug flex-1">
          {task.priority === "urgent" && <Flame className="w-3 h-3 inline text-red-400 mr-1" />}
          {task.title}
        </p>
        <GripVertical className="w-3 h-3 text-d-muted/30 group-hover:text-d-muted flex-shrink-0 mt-0.5" />
      </div>

      {task.description && (
        <p className="mt-1 text-[10px] text-d-muted line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {dueDate && (
          <span className={`text-[10px] ${isOverdue ? "text-red-400" : isToday ? "text-amber-400" : "text-d-muted"}`}>
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
            {dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
        {task.leadName && (
          <span className="text-[10px] text-d-muted">
            <User className="w-2.5 h-2.5 inline mr-0.5" />{task.leadName}
          </span>
        )}
        {task.source && task.source !== "manual" && (
          <span className="rounded-full bg-d-primary/15 px-1.5 py-0.5 text-[9px] text-d-primary">{task.source}</span>
        )}
      </div>

      {task.board !== "done" && (
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="mt-2 w-full rounded-md border border-d-border/60 py-1 text-[10px] text-d-muted hover:border-emerald-500/50 hover:text-emerald-400 transition opacity-0 group-hover:opacity-100"
        >
          Mark Done
        </button>
      )}
    </div>
  );
}

function CreateTaskCard({ onCancel, onCreate, boardId }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), priority, description: description.trim() || null });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-d-primary/40 bg-d-surface p-3 space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full bg-transparent text-xs text-d-text placeholder:text-d-muted/50 outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full bg-transparent text-[11px] text-d-muted placeholder:text-d-muted/30 outline-none resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded bg-d-bg border border-d-border text-[10px] text-d-muted px-1.5 py-1 outline-none"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <div className="flex-1" />
        <button type="button" onClick={onCancel} className="text-[10px] text-d-muted hover:text-d-text">Cancel</button>
        <button type="submit" className="rounded bg-d-primary px-2.5 py-1 text-[10px] font-medium text-white hover:bg-d-primary/80">Add</button>
      </div>
    </form>
  );
}

function EditTaskCard({ task, onSave, onCancel, onDelete }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "normal");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || null, priority });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border-2 border-d-primary/60 bg-d-surface p-3 space-y-2 shadow-lg">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent text-xs font-medium text-d-text outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description..."
        rows={2}
        className="w-full bg-transparent text-[11px] text-d-muted placeholder:text-d-muted/30 outline-none resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded bg-d-bg border border-d-border text-[10px] text-d-muted px-1.5 py-1 outline-none"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <div className="flex-1" />
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Delete</button>
        <button type="button" onClick={onCancel} className="text-[10px] text-d-muted hover:text-d-text">Cancel</button>
        <button type="submit" className="rounded bg-d-primary px-2.5 py-1 text-[10px] font-medium text-white hover:bg-d-primary/80">Save</button>
      </div>
    </form>
  );
}
