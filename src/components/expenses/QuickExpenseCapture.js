// src/components/expenses/QuickExpenseCapture.js
// Mobile-first one-shot expense capture: pick/snap a photo + type a
// natural-language description ("gaz job Mathieu"), server OCRs + matches
// the job + inserts the expense row with receipt URL linked.
// Used from /platform/expenses (global) and from the Finances tab on any job
// (presetJobId locks the match so the LLM still extracts fields from the photo
// but the job_id is forced server-side).

import { useRef, useState } from 'react';
import { Camera, Loader2, CheckCircle2, XCircle, Link2 } from 'lucide-react';

export default function QuickExpenseCapture({ presetJobId = null, presetJobLabel = null, onClose, onSaved }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [step, setStep] = useState('idle'); // idle | uploading | analyzing | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function pickFile() { fileInputRef.current?.click(); }

  function onFileSelected(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Fichier non support\u00e9 (photo ou PDF seulement).');
      return;
    }
    setError(null);
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step !== 'idle') return;
    if (!file && !description.trim()) {
      setError('Ajoute une photo ou une description.');
      return;
    }

    setError(null);
    setResult(null);

    try {
      // 1. Upload file to receipts bucket (if any)
      let imageUrl = null;
      if (file) {
        setStep('uploading');
        const form = new FormData();
        form.append('file', file);
        form.append('bucket', 'receipts');
        const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: form });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || 'Upload \u00e9chou\u00e9');
        imageUrl = uploadJson.url || uploadJson.publicUrl || uploadJson.path || null;
        if (!imageUrl) throw new Error('URL de reçu manquante apr\u00e8s upload');
      }

      // 2. Smart-create
      setStep('analyzing');
      const body = {
        image_url: imageUrl,
        description: description.trim() || null,
      };
      if (presetJobId != null) body.job_id = Number(presetJobId);

      const createRes = await fetch('/api/expenses/smart-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error || 'Enregistrement \u00e9chou\u00e9');

      setResult(createJson);
      setStep('done');
      if (onSaved) onSaved(createJson.expense);
    } catch (err) {
      setError(err.message || 'Erreur inconnue');
      setStep('error');
    }
  }

  function resetAndContinue() {
    setFile(null);
    setPreviewUrl(null);
    setDescription('');
    setResult(null);
    setError(null);
    setStep('idle');
  }

  const busy = step === 'uploading' || step === 'analyzing';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-d-surface border border-d-border sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-d-border/60 sticky top-0 bg-d-surface z-10">
          <div>
            <h2 className="text-sm font-semibold text-d-text">Ajout rapide de dépense</h2>
            {presetJobLabel && (
              <p className="text-[11px] text-d-muted mt-0.5 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> liée à {presetJobLabel}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-d-muted hover:text-d-text text-xl leading-none px-2" aria-label="Fermer">×</button>
        </div>

        {step === 'done' && result ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Dépense enregistrée</span>
            </div>
            <div className="bg-d-bg/50 rounded-xl border border-d-border p-3 text-xs space-y-2">
              <div className="flex justify-between"><span className="text-d-muted">Total</span><span className="font-mono text-d-text">{result.extracted?.total != null ? `${result.extracted.total} $` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-d-muted">Catégorie</span><span className="text-d-text">{result.extracted?.category || '—'}</span></div>
              <div className="flex justify-between"><span className="text-d-muted">Vendeur</span><span className="text-d-text truncate ml-4">{result.extracted?.vendor || '—'}</span></div>
              {result.matched_job ? (
                <div className="flex justify-between items-center gap-2 pt-2 border-t border-d-border/40">
                  <span className="text-d-muted">Projet lié</span>
                  <a href={`/platform/jobs/${result.matched_job.id}`} className="text-d-primary font-semibold truncate max-w-[60%] text-right">
                    {result.matched_job.client_name || result.matched_job.job_id || `#${result.matched_job.id}`}
                  </a>
                </div>
              ) : (
                <div className="flex justify-between pt-2 border-t border-d-border/40">
                  <span className="text-d-muted">Projet</span>
                  <span className="text-d-muted italic">non lié</span>
                </div>
              )}
              {result.confidence != null && (
                <div className="flex justify-between"><span className="text-d-muted">Confiance IA</span><span className="text-d-text">{Math.round(result.confidence * 100)}%</span></div>
              )}
              {result.match_reason && (
                <div className="text-[10px] text-d-muted italic pt-1">Match: {result.match_reason}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={resetAndContinue} className="flex-1 bg-d-primary text-white rounded-lg px-4 py-2.5 font-semibold text-sm">
                Nouvelle dépense
              </button>
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-d-border text-d-text text-sm">
                Terminer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {/* File picker / camera */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={onFileSelected}
                className="hidden"
              />
              {previewUrl ? (
                <button
                  type="button"
                  onClick={pickFile}
                  className="w-full rounded-xl border-2 border-d-border overflow-hidden relative"
                  disabled={busy}
                >
                  <img src={previewUrl} alt="Reçu" className="w-full max-h-64 object-contain bg-d-bg" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs text-center py-1.5">
                    Tap pour changer
                  </div>
                </button>
              ) : file ? (
                <button
                  type="button"
                  onClick={pickFile}
                  className="w-full rounded-xl border-2 border-dashed border-d-border p-4 text-center text-sm text-d-text"
                  disabled={busy}
                >
                  📄 {file.name}
                  <div className="text-[11px] text-d-muted mt-1">Tap pour changer</div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pickFile}
                  className="w-full rounded-xl border-2 border-dashed border-d-border p-8 text-center hover:border-d-primary/40 transition flex flex-col items-center gap-2"
                  disabled={busy}
                >
                  <Camera className="w-8 h-8 text-d-primary" />
                  <span className="text-sm font-semibold text-d-text">Prendre une photo</span>
                  <span className="text-[11px] text-d-muted">ou choisir un fichier (photo / PDF)</span>
                </button>
              )}
            </div>

            {/* Natural-language description */}
            <div>
              <label className="text-[11px] text-d-muted font-semibold uppercase tracking-wider mb-1 block">
                Décris la dépense
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: frais matériaux job Melissa · gaz job Mathieu · frais admin"
                rows={3}
                className="w-full rounded-lg border border-d-border bg-d-bg text-d-text text-sm px-3 py-2 focus:outline-none focus:border-d-primary resize-none"
                disabled={busy}
              />
              <p className="text-[10px] text-d-muted mt-1">
                {presetJobId
                  ? 'Cette dépense sera automatiquement liée au projet actif.'
                  : "Écris le prénom du client ou l'adresse pour lier au bon projet automatiquement."}
              </p>
            </div>

            {error && (
              <div className="text-xs text-rose-500 flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || (!file && !description.trim())}
              className="w-full bg-d-primary text-white rounded-lg px-4 py-3 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 'uploading' ? 'Téléversement…' : 'Analyse IA…'}
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
