// pages/platform/payroll/index.js
// Two-pane payroll workspace:
//   Left  — employee roster (active list + add form, archive button)
//   Right — time entries log (filter by employee + date range, add entry)
//
// F-P9 scope: log hours → gross pay. DAS breakdown columns are rendered
// "—" until F-P10 fills them in.

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import { Plus, Loader2, Users, Clock, Trash2, Archive, Calculator, AlertTriangle } from 'lucide-react';

function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { year: '2-digit', month: 'short', day: 'numeric' });
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function PayrollPage() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ hours: 0, gross: 0, count: 0 });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPayRun, setShowPayRun] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayIso);

  const loadEmployees = useCallback(async () => {
    const res = await fetch('/api/employees');
    if (!res.ok) throw new Error('Erreur chargement employés');
    const json = await res.json();
    setEmployees(json.employees || []);
  }, []);

  const loadEntries = useCallback(async () => {
    const params = new URLSearchParams({ from, to });
    if (filterEmployee) params.set('employee_id', filterEmployee);
    const res = await fetch(`/api/time-entries?${params}`);
    if (!res.ok) throw new Error('Erreur chargement heures');
    const json = await res.json();
    setEntries(json.entries || []);
    setTotals(json.totals || { hours: 0, gross: 0, count: 0 });
  }, [filterEmployee, from, to]);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const jobsRes = fetch('/api/jobs?page=1&pageSize=50');
      await Promise.all([loadEmployees(), loadEntries()]);
      const jobsJson = await jobsRes.then(r => r.ok ? r.json() : { items: [] });
      setJobs(jobsJson.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadEmployees, loadEntries]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadEntries().catch((e) => setError(e.message)); }, [loadEntries]);

  const activeEmployees = useMemo(() => employees.filter((e) => e.status === 'active'), [employees]);
  const employeeById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  async function archiveEmployee(id) {
    if (!confirm('Archiver cet employé ? (son historique est conservé)')) return;
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('Erreur archivage'); return; }
    loadEmployees();
  }

  async function deleteEntry(id) {
    if (!confirm('Supprimer cette entrée ?')) return;
    const res = await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Erreur suppression');
      return;
    }
    loadEntries();
  }

  return (
    <DashboardLayout title="Paie">
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold text-d-text">Paie & heures</h1>
            <p className="text-xs text-d-muted">Log les heures → calcul des déductions à la source → pro-rata sur les entrées.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPayRun(true)}
            disabled={activeEmployees.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-d-primary text-white hover:opacity-90 disabled:opacity-40 transition"
          >
            <Calculator size={14} /> Préparer la paie
          </button>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300 flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Estimation seulement.</strong> Les taux DAS 2026 (RRQ, EI, RQAP, impôts fédéral/QC, CNESST) sont basés sur les tables officielles connues. Ton comptable doit valider avant la remise à Revenu Québec / ARC.
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="Employés actifs" value={activeEmployees.length} icon={<Users size={14} />} />
          <StatCard label={`Heures (${from} → ${to})`} value={totals.hours} icon={<Clock size={14} />} suffix="h" />
          <StatCard label="Brut à payer" value={fmtMoney(totals.gross)} tone="emerald" />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-xs text-d-muted animate-pulse">
            <Loader2 size={18} className="animate-spin mx-auto mb-2" />
            Chargement…
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            {/* Employees panel */}
            <section className="rounded-xl border border-d-border bg-d-surface/30 overflow-hidden">
              <header className="flex items-center justify-between px-4 py-2 border-b border-d-border bg-d-surface/50">
                <p className="text-[11px] font-semibold text-d-muted uppercase tracking-wider">Employés</p>
                <button
                  type="button"
                  onClick={() => setShowEmpForm(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-d-primary hover:opacity-80"
                >
                  <Plus size={12} /> Ajouter
                </button>
              </header>

              {employees.length === 0 ? (
                <div className="py-10 text-center text-xs text-d-muted">
                  <Users size={22} className="mx-auto mb-2 text-d-muted/40" />
                  Aucun employé. Ajoute ta première personne.
                </div>
              ) : (
                <ul>
                  {employees.map((e) => (
                    <li key={e.id} className={`px-4 py-3 border-b border-d-border/40 last:border-0 ${e.status === 'inactive' ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setEditEmp(e)}
                          className="min-w-0 text-left flex-1 hover:opacity-80 transition"
                          title="Modifier / paramètres DAS"
                        >
                          <p className="text-sm text-d-text truncate">{e.full_name}</p>
                          <p className="text-[10px] text-d-muted">
                            {e.role || '—'} · {fmtMoney(e.hourly_rate)}/h
                            {e.status === 'inactive' && <span className="ml-1 text-amber-400">· archivé</span>}
                          </p>
                        </button>
                        {e.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => archiveEmployee(e.id)}
                            className="text-d-muted hover:text-rose-400 transition p-1"
                            title="Archiver"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Time entries panel */}
            <section className="rounded-xl border border-d-border bg-d-surface/30 overflow-hidden">
              <header className="px-4 py-3 border-b border-d-border bg-d-surface/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-d-muted uppercase tracking-wider">Heures loggées</p>
                  <button
                    type="button"
                    onClick={() => setShowEntryForm(true)}
                    disabled={activeEmployees.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-d-primary text-white hover:opacity-90 disabled:opacity-40 transition"
                  >
                    <Plus size={12} /> Nouvelle entrée
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center text-[11px]">
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="px-2 py-1 rounded-md border border-d-border bg-d-surface"
                  >
                    <option value="">Tous les employés</option>
                    {activeEmployees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                  <input
                    type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                    className="px-2 py-1 rounded-md border border-d-border bg-d-surface"
                  />
                  <span className="text-d-muted">→</span>
                  <input
                    type="date" value={to} onChange={(e) => setTo(e.target.value)}
                    className="px-2 py-1 rounded-md border border-d-border bg-d-surface"
                  />
                </div>
              </header>

              {entries.length === 0 ? (
                <div className="py-10 text-center text-xs text-d-muted">
                  <Clock size={22} className="mx-auto mb-2 text-d-muted/40" />
                  Aucune entrée pour la période. Ajoute-en une.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-d-surface/30 border-b border-d-border/40 text-[10px] uppercase tracking-wider text-d-muted">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Date</th>
                        <th className="text-left px-3 py-2 font-semibold">Employé</th>
                        <th className="text-left px-3 py-2 font-semibold">Projet</th>
                        <th className="text-right px-3 py-2 font-semibold">Heures</th>
                        <th className="text-right px-3 py-2 font-semibold">Taux</th>
                        <th className="text-right px-3 py-2 font-semibold">Brut</th>
                        <th className="text-right px-3 py-2 font-semibold">Net</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => {
                        const emp = employeeById.get(e.employee_id);
                        const job = jobs.find((j) => j.id === e.job_id);
                        return (
                          <tr key={e.id} className="border-b border-d-border/30 last:border-0 hover:bg-d-surface/30">
                            <td className="px-3 py-2 text-d-text">{fmtDate(e.work_date)}</td>
                            <td className="px-3 py-2 text-d-text">{e.employee_name || emp?.full_name || '—'}</td>
                            <td className="px-3 py-2 text-d-muted">{job ? `${job.job_id}` : '—'}</td>
                            <td className="px-3 py-2 text-right font-mono text-d-text">{Number(e.hours).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-mono text-d-muted">{fmtMoney(e.hourly_rate)}</td>
                            <td className="px-3 py-2 text-right font-mono text-d-text">{fmtMoney(e.gross)}</td>
                            <td className="px-3 py-2 text-right font-mono text-d-muted/70">{e.net_pay != null ? fmtMoney(e.net_pay) : '—'}</td>
                            <td className="px-2 py-2 text-right">
                              {!e.pay_run_id && (
                                <button
                                  type="button"
                                  onClick={() => deleteEntry(e.id)}
                                  className="text-d-muted hover:text-rose-400 transition"
                                  title="Supprimer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t border-d-border bg-d-surface/40 text-[11px]">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-d-muted font-semibold">Total</td>
                        <td className="px-3 py-2 text-right font-mono text-d-text">{totals.hours.toFixed(2)}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-400">{fmtMoney(totals.gross)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {showEmpForm && (
          <AddEmployeeModal
            onClose={() => setShowEmpForm(false)}
            onSaved={() => { setShowEmpForm(false); loadEmployees(); }}
          />
        )}

        {showEntryForm && (
          <AddTimeEntryModal
            employees={activeEmployees}
            jobs={jobs}
            onClose={() => setShowEntryForm(false)}
            onSaved={() => { setShowEntryForm(false); loadEntries(); }}
          />
        )}

        {showPayRun && (
          <PayRunModal
            employees={activeEmployees}
            defaultFrom={from}
            defaultTo={to}
            onClose={() => setShowPayRun(false)}
            onCommitted={() => { setShowPayRun(false); loadEntries(); }}
          />
        )}

        {editEmp && (
          <EditEmployeeModal
            employee={editEmp}
            onClose={() => setEditEmp(null)}
            onSaved={() => { setEditEmp(null); loadEmployees(); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, suffix, icon, tone = 'primary' }) {
  const toneStyles = {
    primary: 'border-d-border bg-d-surface/40 text-d-text',
    emerald: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400',
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${toneStyles.split(' ').filter((c) => !c.startsWith('text-')).join(' ')}`}>
      <p className="text-[9px] uppercase tracking-wider text-d-muted mb-1 flex items-center gap-1">{icon}{label}</p>
      <p className={`text-base font-semibold font-mono ${toneStyles.split(' ').filter((c) => c.startsWith('text-')).join(' ')}`}>
        {value}{suffix ? <span className="text-xs text-d-muted ml-1">{suffix}</span> : null}
      </p>
    </div>
  );
}

function AddEmployeeModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    role: 'installateur', hourly_rate: '',
    phone: '', email: '', hire_date: todayIso(),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault(); setErr(null);
    if (!form.first_name.trim()) { setErr('Prénom requis'); return; }
    const rate = Number(form.hourly_rate);
    if (!(rate >= 0)) { setErr('Taux horaire invalide'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hourly_rate: rate }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      onSaved();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-md p-6 my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Ajouter un employé</h2>
          <button type="button" onClick={onClose} className="text-d-muted hover:text-d-text">✕</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" value={form.first_name} onChange={(v) => upd('first_name', v)} autoFocus />
            <Field label="Nom" value={form.last_name} onChange={(v) => upd('last_name', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1">Rôle</label>
              <select
                value={form.role} onChange={(e) => upd('role', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              >
                <option value="installateur">Installateur</option>
                <option value="mesureur">Mesureur</option>
                <option value="apprenti">Apprenti</option>
                <option value="aide">Aide</option>
                <option value="contremaitre">Contremaître</option>
                <option value="admin">Admin / bureau</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <Field label="Taux $/h *" value={form.hourly_rate} onChange={(v) => upd('hourly_rate', v)} type="number" step="0.01" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone" value={form.phone} onChange={(v) => upd('phone', v)} type="tel" />
            <Field label="Courriel" value={form.email} onChange={(v) => upd('email', v)} type="email" />
          </div>
          <Field label="Date d'embauche" value={form.hire_date} onChange={(v) => upd('hire_date', v)} type="date" />

          {err && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{err}</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text">Annuler</button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-d-primary text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddTimeEntryModal({ employees, jobs, onClose, onSaved }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [jobId, setJobId] = useState('');
  const [workDate, setWorkDate] = useState(todayIso());
  const [hours, setHours] = useState('8');
  const [overrideRate, setOverrideRate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const emp = employees.find((e) => e.id === employeeId);
  const effectiveRate = overrideRate ? Number(overrideRate) : Number(emp?.hourly_rate || 0);
  const gross = (Number(hours) || 0) * effectiveRate;

  async function submit(e) {
    e.preventDefault(); setErr(null);
    if (!employeeId) { setErr('Sélectionne un employé'); return; }
    const h = Number(hours);
    if (!(h > 0 && h <= 24)) { setErr('Heures entre 0 et 24'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          job_id: jobId || undefined,
          work_date: workDate,
          hours: h,
          hourly_rate_override: overrideRate ? Number(overrideRate) : undefined,
          description: description.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      onSaved();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-md p-6 my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Logger des heures</h2>
          <button type="button" onClick={onClose} className="text-d-muted hover:text-d-text">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-d-muted mb-1">Employé</label>
            <select
              value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
              required
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} — {fmtMoney(e.hourly_rate)}/h
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" value={workDate} onChange={setWorkDate} type="date" />
            <Field label="Heures" value={hours} onChange={setHours} type="number" step="0.25" min="0" max="24" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Taux $/h (override)" value={overrideRate} onChange={setOverrideRate} type="number" step="0.01" placeholder={emp ? String(emp.hourly_rate) : ''} />
            <div>
              <label className="block text-xs text-d-muted mb-1">Brut (auto)</label>
              <div className="px-3 py-2 rounded-xl border border-d-border bg-d-surface/40 text-sm font-mono text-emerald-400">
                {fmtMoney(gross)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">Projet (optionnel)</label>
            <select
              value={jobId} onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
            >
              <option value="">— Non lié —</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.job_id} · {j.client_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">Description (optionnel)</label>
            <textarea
              rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: pose 3 fenêtres chambres"
              className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
            />
          </div>

          {err && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{err}</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text">Annuler</button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-d-primary text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', step, min, max, autoFocus, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-d-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step} min={min} max={max}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm"
      />
    </div>
  );
}

function PayRunModal({ employees, defaultFrom, defaultTo, onClose, onCommitted }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to,   setTo]   = useState(defaultTo);
  const [payPeriod, setPayPeriod] = useState('biweekly');
  const [selected, setSelected] = useState(() => new Set(employees.map((e) => e.id)));
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [err, setErr] = useState(null);

  function toggleEmp(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function runPreview() {
    setLoading(true); setErr(null); setPreview(null);
    try {
      const res = await fetch('/api/pay-runs/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from, to, pay_period: payPeriod,
          employee_ids: [...selected],
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setPreview(j);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function commit() {
    if (!preview || preview.rows.length === 0) return;
    if (!confirm(`Confirmer la paie de ${fmtMoney(preview.totals.net_pay)} net (${preview.totals.entry_count} entrées) ?\n\nLes entrées deviendront immuables après cette opération.`)) return;
    setCommitting(true); setErr(null);
    try {
      const res = await fetch('/api/pay-runs/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from, to, pay_period: payPeriod,
          employee_ids: [...selected],
          confirm: true,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      alert(`Paie confirmée — ${j.updated} entrée${j.updated > 1 ? 's' : ''} mise${j.updated > 1 ? 's' : ''} à jour.`);
      onCommitted();
    } catch (e) {
      setErr(e.message);
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text flex items-center gap-2">
            <Calculator size={14} /> Préparer la paie — calcul DAS 2026
          </h2>
          <button type="button" onClick={onClose} className="text-d-muted hover:text-d-text">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-d-muted mb-1">Du</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-d-muted mb-1">Au</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-d-muted mb-1">Fréquence</label>
              <select value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm">
                <option value="weekly">Hebdomadaire (52/an)</option>
                <option value="biweekly">Aux 2 semaines (26/an)</option>
                <option value="semimonthly">Bimensuelle (24/an)</option>
                <option value="monthly">Mensuelle (12/an)</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-d-muted mb-2">Employés inclus</p>
            <div className="flex flex-wrap gap-2">
              {employees.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleEmp(e.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
                    selected.has(e.id)
                      ? 'bg-d-primary/15 text-d-primary border-d-primary/40'
                      : 'bg-d-surface text-d-muted border-d-border hover:text-d-text'
                  }`}
                >
                  {e.full_name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={runPreview}
              disabled={loading || selected.size === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-d-surface border border-d-border hover:bg-d-surface/70 disabled:opacity-40 transition"
            >
              {loading ? <><Loader2 size={12} className="animate-spin" /> Calcul…</> : 'Calculer DAS'}
            </button>
            {preview && preview.rows.length > 0 && (
              <button
                type="button"
                onClick={commit}
                disabled={committing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {committing ? <><Loader2 size={12} className="animate-spin" /> Application…</> : `Confirmer la paie — ${fmtMoney(preview.totals.net_pay)} net`}
              </button>
            )}
          </div>

          {err && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{err}</p>
          )}

          {preview && preview.rows.length === 0 && (
            <p className="text-xs text-d-muted text-center py-6">Aucune entrée non-payée dans cette période.</p>
          )}

          {preview && preview.rows.length > 0 && (
            <div className="rounded-xl border border-d-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-d-surface/50 border-b border-d-border text-[10px] uppercase tracking-wider text-d-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Employé</th>
                      <th className="text-right px-3 py-2 font-semibold">Heures</th>
                      <th className="text-right px-3 py-2 font-semibold">Brut</th>
                      <th className="text-right px-3 py-2 font-semibold">RRQ</th>
                      <th className="text-right px-3 py-2 font-semibold">EI</th>
                      <th className="text-right px-3 py-2 font-semibold">RQAP</th>
                      <th className="text-right px-3 py-2 font-semibold">Fed</th>
                      <th className="text-right px-3 py-2 font-semibold">QC</th>
                      <th className="text-right px-3 py-2 font-semibold">Net</th>
                      <th className="text-right px-3 py-2 font-semibold text-amber-400">Coût total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.employee_id} className="border-b border-d-border/40 last:border-0">
                        <td className="px-3 py-2 text-d-text">{r.employee_name}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.hours.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-d-text">{fmtMoney(r.gross)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-400/80">{fmtMoney(r.deductions.rrq)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-400/80">{fmtMoney(r.deductions.ei)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-400/80">{fmtMoney(r.deductions.rqap)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-400/80">{fmtMoney(r.deductions.federal_tax)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-400/80">{fmtMoney(r.deductions.qc_tax)}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-400 font-semibold">{fmtMoney(r.net_pay)}</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-400">{fmtMoney(r.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-d-border bg-d-surface/40">
                    <tr>
                      <td className="px-3 py-2 font-semibold text-d-muted">Total</td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-right font-mono text-d-text">{fmtMoney(preview.totals.gross)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-400">{fmtMoney(preview.totals.deductions.rrq)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-400">{fmtMoney(preview.totals.deductions.ei)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-400">{fmtMoney(preview.totals.deductions.rqap)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-400">{fmtMoney(preview.totals.deductions.federal_tax)}</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-400">{fmtMoney(preview.totals.deductions.qc_tax)}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-400 font-semibold">{fmtMoney(preview.totals.net_pay)}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-400 font-semibold">{fmtMoney(preview.totals.total_cost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="px-3 py-2 bg-d-surface/30 border-t border-d-border text-[10px] text-d-muted flex flex-wrap gap-4">
                <span>Contributions employeur: RRQ {fmtMoney(preview.totals.employer.rrq)}</span>
                <span>EI {fmtMoney(preview.totals.employer.ei)}</span>
                <span>RQAP {fmtMoney(preview.totals.employer.rqap)}</span>
                <span>CNESST {fmtMoney(preview.totals.employer.cnesst)}</span>
              </div>
            </div>
          )}

          {preview && (
            <p className="text-[10px] text-d-muted">⚠️ {preview.rates_note}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditEmployeeModal({ employee, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: employee.first_name || '',
    last_name:  employee.last_name  || '',
    role:       employee.role || 'installateur',
    hourly_rate: employee.hourly_rate != null ? String(employee.hourly_rate) : '',
    phone:      employee.phone || '',
    email:      employee.email || '',
    td1_federal: employee.td1_federal != null ? String(employee.td1_federal) : '',
    tp1015_qc:   employee.tp1015_qc   != null ? String(employee.tp1015_qc)   : '',
    notes:      employee.notes || '',
  });
  const [sinInput, setSinInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault(); setErr(null);
    setSaving(true);
    try {
      const patch = {
        ...form,
        hourly_rate: Number(form.hourly_rate) || 0,
        td1_federal: form.td1_federal ? Number(form.td1_federal) : null,
        tp1015_qc:   form.tp1015_qc   ? Number(form.tp1015_qc)   : null,
      };
      // SIN: send clear to server where it gets encrypted
      if (sinInput.trim()) {
        const digits = sinInput.replace(/\D/g, '');
        if (digits.length !== 9) throw new Error('NAS doit avoir 9 chiffres');
        patch.sin_plain = digits;
      }
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      onSaved();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-d-bg border border-d-border rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-d-text">Modifier {employee.full_name}</h2>
          <button type="button" onClick={onClose} className="text-d-muted hover:text-d-text">✕</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" value={form.first_name} onChange={(v) => upd('first_name', v)} />
            <Field label="Nom" value={form.last_name} onChange={(v) => upd('last_name', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-d-muted mb-1">Rôle</label>
              <select value={form.role} onChange={(e) => upd('role', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm">
                <option value="installateur">Installateur</option>
                <option value="mesureur">Mesureur</option>
                <option value="apprenti">Apprenti</option>
                <option value="aide">Aide</option>
                <option value="contremaitre">Contremaître</option>
                <option value="admin">Admin / bureau</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <Field label="Taux $/h *" value={form.hourly_rate} onChange={(v) => upd('hourly_rate', v)} type="number" step="0.01" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone" value={form.phone} onChange={(v) => upd('phone', v)} type="tel" />
            <Field label="Courriel" value={form.email} onChange={(v) => upd('email', v)} type="email" />
          </div>

          <div className="border-t border-d-border/40 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-d-muted mb-2">Paramètres DAS</p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="TD1 fédéral"
                value={form.td1_federal}
                onChange={(v) => upd('td1_federal', v)}
                type="number" step="1"
                placeholder="16129 (défaut)"
              />
              <Field
                label="TP-1015.3 Québec"
                value={form.tp1015_qc}
                onChange={(v) => upd('tp1015_qc', v)}
                type="number" step="1"
                placeholder="18056 (défaut)"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-d-muted mb-1">
                NAS {employee.sin_encrypted ? <span className="text-emerald-400">· chiffré en BD</span> : <span className="text-amber-400">· non renseigné</span>}
              </label>
              <input
                type="text"
                value={sinInput}
                onChange={(e) => setSinInput(e.target.value)}
                placeholder={employee.sin_encrypted ? '•••–•••–••• (laisser vide pour conserver)' : '000-000-000'}
                className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm font-mono"
                autoComplete="off"
              />
              <p className="mt-1 text-[10px] text-d-muted">Chiffré AES-256-GCM côté serveur. Jamais affiché en clair après enregistrement.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-d-muted mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => upd('notes', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-d-border bg-d-surface text-sm" />
          </div>

          {err && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{err}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-d-border text-sm text-d-muted hover:text-d-text">Annuler</button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-d-primary text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
