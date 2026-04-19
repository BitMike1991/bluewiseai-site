// src/components/ui/MediaPicker.js
// Reusable media picker for photos/PDFs. Supports:
//   - File input + drag & drop
//   - Mobile camera capture (capture="environment" on input)
//   - Client-side JPEG resize for images >1600px to cut upload weight
//   - Upload to /api/media/upload with bucket + context + optional job_id
//   - Progress state, per-file error surface
//
// Props:
//   value?       string|string[]  existing URL(s) (for display / multi-mode)
//   multiple?    boolean
//   bucket?      string           default 'media'
//   context?     string           required — e.g. 'receipt', 'window', 'toiture'
//   jobId?       number           optional — nests path under job-<id>/
//   maxFiles?    number           default 10 in multi mode
//   accept?      string           default 'image/*,application/pdf'
//   onChange     (urls) => void   urls array (or single string) on change
//   className?   string
//   label?       string           default 'Ajouter photo ou PDF'

import { useCallback, useRef, useState } from 'react';
import { Camera, X, FileText, Loader2 } from 'lucide-react';

const DEFAULT_ACCEPT = 'image/*,application/pdf';
const RESIZE_MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

async function resizeIfImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  // Skip HEIC/HEIF — browser canvas usually can't decode, let the server handle
  if (/^image\/(heic|heif)$/i.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width: w, height: h } = bitmap;
    if (w <= RESIZE_MAX_DIM && h <= RESIZE_MAX_DIM) {
      bitmap.close?.();
      return file;
    }
    const scale = RESIZE_MAX_DIM / Math.max(w, h);
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file; // fall through — let the server get the original
  }
}

export default function MediaPicker({
  value,
  multiple = false,
  bucket = 'media',
  context = 'misc',
  jobId,
  maxFiles = 10,
  accept = DEFAULT_ACCEPT,
  onChange,
  className = '',
  label = 'Ajouter photo ou PDF',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState(null);
  const [dragOver, setDragOver]   = useState(false);

  const urls = Array.isArray(value) ? value : value ? [value] : [];

  const emit = (next) => {
    onChange(multiple ? next : (next[0] || ''));
  };

  const uploadOne = useCallback(async (file) => {
    const form = new FormData();
    const prepared = await resizeIfImage(file);
    form.append('file', prepared);
    form.append('context', context);
    form.append('bucket', bucket);
    if (jobId) form.append('job_id', String(jobId));
    const res = await fetch('/api/media/upload', { method: 'POST', body: form });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
    return json.url;
  }, [bucket, context, jobId]);

  const handleFiles = useCallback(async (fileList) => {
    const picked = Array.from(fileList);
    if (!picked.length) return;
    const allowedCount = multiple ? Math.max(0, maxFiles - urls.length) : 1;
    const subset = picked.slice(0, allowedCount);
    if (!subset.length) {
      setErrorMsg(`Max ${maxFiles} fichiers atteint`);
      return;
    }
    setErrorMsg(null);
    setUploading(true);
    try {
      const results = [];
      for (const f of subset) {
        const url = await uploadOne(f);
        if (url) results.push(url);
      }
      emit([...urls, ...results]);
    } catch (err) {
      setErrorMsg(err.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadOne, multiple, maxFiles, urls]);

  const removeAt = (i) => {
    emit(urls.filter((_, idx) => idx !== i));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed transition ${
          dragOver
            ? 'border-d-primary bg-d-primary/10'
            : 'border-d-border bg-d-surface/30'
        } p-4`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || (!multiple && urls.length >= 1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-d-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? 'Téléversement…' : label}
          </button>
          <span className="text-[10px] text-d-muted">ou glisse-dépose ici</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {errorMsg && (
          <p className="mt-2 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-md px-2 py-1">
            {errorMsg}
          </p>
        )}

        {urls.length > 0 && (
          <div className={`mt-3 grid ${multiple ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' : 'grid-cols-1'} gap-2`}>
            {urls.map((url, i) => (
              <div key={url + i} className="relative group rounded-lg overflow-hidden border border-d-border bg-d-surface">
                {/\.pdf(\?.*)?$/i.test(url) ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center aspect-square text-d-muted hover:text-d-text">
                    <FileText size={20} />
                    <span className="text-[9px] mt-1">PDF</span>
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={url} alt={`Media ${i + 1}`} className="w-full aspect-square object-cover" loading="lazy" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Retirer"
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
