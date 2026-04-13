// pages/platform/calendar.js — Google Calendar + Tasks with due dates
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../../src/components/dashboard/DashboardLayout";
import { ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink, CalendarDays, Loader2, AlertCircle } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);

      try {
        // Fetch calendar events + tasks in parallel
        const [calRes, taskRes] = await Promise.all([
          fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`).then(r => r.json()).catch(() => ({ events: [], connected: false })),
          fetch("/api/tasks?pageSize=100").then(r => r.json()).catch(() => ({ data: [] })),
        ]);

        setEvents(calRes.events || []);
        setConnected(calRes.connected !== false);
        setTasks((taskRes.data || []).filter(t => t.dueAt));
      } catch (err) {
        setError(err.message || "Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [year, month]);

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };
  const goToday = () => setCurrentDate(new Date());

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Blank days from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toDateString();

      const dayEvents = events.filter(e => {
        const eDate = new Date(e.start);
        return eDate.toDateString() === dateStr;
      });

      const dayTasks = tasks.filter(t => {
        const tDate = new Date(t.dueAt);
        return tDate.toDateString() === dateStr;
      });

      days.push({ day: d, date, events: dayEvents, tasks: dayTasks });
    }

    return days;
  }, [events, tasks, year, month]);

  const today = new Date().toDateString();
  const selectedDateStr = selectedDay?.toDateString();

  const selectedDayData = selectedDay ? calendarDays.find(d => d.date?.toDateString() === selectedDateStr) : null;

  return (
    <DashboardLayout title="Calendar">
      <header className="mb-4 border-b border-d-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="rounded-lg border border-d-border p-1.5 hover:bg-d-surface transition">
              <ChevronLeft className="w-4 h-4 text-d-muted" />
            </button>
            <h1 className="text-lg font-semibold sm:text-xl">
              {MONTHS[month]} {year}
            </h1>
            <button onClick={nextMonth} className="rounded-lg border border-d-border p-1.5 hover:bg-d-surface transition">
              <ChevronRight className="w-4 h-4 text-d-muted" />
            </button>
            <button onClick={goToday} className="rounded-lg border border-d-border px-2.5 py-1 text-xs text-d-muted hover:bg-d-surface transition">
              Today
            </button>
          </div>
          {connected === false && (
            <a href="/platform/settings" className="text-[11px] text-amber-400 hover:underline">
              Connect Google Calendar in Settings
            </a>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-d-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading calendar...
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Calendar grid */}
          <div className="flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-d-muted py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-d-border/30 rounded-xl overflow-hidden border border-d-border/60">
              {calendarDays.map((cell, i) => (
                <div
                  key={cell.date ? cell.date.toISOString() : 'pad-' + i}
                  onClick={() => cell.date && setSelectedDay(cell.date)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 transition cursor-pointer ${
                    !cell.day ? "bg-d-bg/50" :
                    cell.date?.toDateString() === selectedDateStr ? "bg-d-primary/10 ring-1 ring-d-primary/40" :
                    cell.date?.toDateString() === today ? "bg-amber-500/5" :
                    "bg-d-bg hover:bg-d-surface/50"
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className={`text-xs font-medium mb-1 ${
                        cell.date?.toDateString() === today ? "text-amber-400" : "text-d-text"
                      }`}>
                        {cell.day}
                      </div>

                      {/* Event dots */}
                      <div className="space-y-0.5">
                        {(cell.events || []).slice(0, 3).map((e) => (
                          <div key={e.id} className="rounded bg-blue-500/20 px-1 py-0.5 text-[9px] text-blue-300 truncate">
                            {e.allDay ? "" : new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " "}{e.title}
                          </div>
                        ))}
                        {(cell.tasks || []).slice(0, 2).map((t) => (
                          <div key={t.id} className={`rounded px-1 py-0.5 text-[9px] truncate ${
                            t.isOverdue ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                          }`}>
                            {t.title}
                          </div>
                        ))}
                        {((cell.events?.length || 0) + (cell.tasks?.length || 0)) > 5 && (
                          <div className="text-[9px] text-d-muted">+{(cell.events.length + cell.tasks.length) - 5} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Day detail sidebar */}
          {selectedDay && selectedDayData && (
            <div className="w-72 flex-shrink-0 rounded-xl border border-d-border/60 bg-d-bg overflow-hidden">
              <div className="bg-d-surface px-4 py-3 border-b border-d-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-d-text">
                    {selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="text-d-muted hover:text-d-text">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
                {(selectedDayData.events || []).length === 0 && (selectedDayData.tasks || []).length === 0 && (
                  <p className="text-xs text-d-muted/50 text-center py-8">Nothing scheduled</p>
                )}

                {(selectedDayData.events || []).map(e => (
                  <div key={e.id} className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-medium text-d-text">{e.title}</p>
                      {e.htmlLink && (
                        <a href={e.htmlLink} target="_blank" rel="noopener noreferrer" className="text-d-muted hover:text-blue-400">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {!e.allDay && (
                      <p className="mt-1 text-[10px] text-blue-300 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {e.end && ` - ${new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    )}
                    {e.location && (
                      <p className="mt-1 text-[10px] text-d-muted flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{e.location}
                      </p>
                    )}
                  </div>
                ))}

                {(selectedDayData.tasks || []).map(t => (
                  <div key={t.id} className={`rounded-lg border p-3 ${
                    t.isOverdue ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
                  }`}>
                    <p className="text-xs font-medium text-d-text">{t.title}</p>
                    {t.description && <p className="mt-1 text-[10px] text-d-muted">{t.description}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${
                        t.priority === "urgent" ? "bg-red-500/20 text-red-300" :
                        t.priority === "high" ? "bg-amber-500/20 text-amber-300" :
                        "bg-d-border/40 text-d-muted"
                      }`}>{t.priority}</span>
                      {t.leadName && <span className="text-[9px] text-d-muted">{t.leadName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
