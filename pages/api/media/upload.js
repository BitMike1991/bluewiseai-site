// pages/api/media/upload.js
// Upload a media file (photo or PDF) to Supabase Storage, scoped to the
// caller's tenant by path convention: {customer_id}/{context}/{uuid}.{ext}.
//
// POST multipart/form-data  fields:
//   file      (binary)
//   context   (string)    'receipt' | 'toiture' | 'window' | 'doc' | ...
//   bucket    (string)    'media' (default) | 'receipts' | 'contracts' | 'documents'
//   job_id    (optional)  nested under job folder for easier audit traversal
//
// Returns { url, path, bucket, size, mime }.

import formidable from 'formidable';
import fs from 'fs';
import crypto from 'crypto';
import { getAuthContext } from '../../../lib/supabaseServer';
import { checkRateLimit } from '../../../lib/security';

export const config = { api: { bodyParser: false } };

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif',
  'application/pdf',
]);
const ALLOWED_BUCKETS = new Set(['media', 'receipts', 'documents']);
const ALLOWED_CONTEXTS = new Set(['receipt', 'toiture', 'window', 'expense', 'lead', 'doc', 'misc']);

function extFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg':  'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
  };
  return map[mime] || 'bin';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  if (checkRateLimit(req, res, `media-upload:${customerId}`, 60)) return;

  let fields, files;
  try {
    const form = formidable({ maxFileSize: MAX_FILE_BYTES, multiples: false });
    [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => err ? reject(err) : resolve([flds, fls]));
    });
  } catch (err) {
    return res.status(400).json({ error: `Upload parse failed: ${err.message}` });
  }

  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!file || !file.filepath) return res.status(400).json({ error: 'file field required' });

  if (file.size > MAX_FILE_BYTES) {
    return res.status(413).json({ error: `File exceeds ${MAX_FILE_BYTES / 1024 / 1024} MB` });
  }
  const mime = file.mimetype || 'application/octet-stream';
  if (!ALLOWED_MIME.has(mime)) {
    return res.status(400).json({ error: `Mime type ${mime} not allowed` });
  }

  const contextRaw = String(Array.isArray(fields.context) ? fields.context[0] : fields.context || 'misc').toLowerCase();
  const context    = ALLOWED_CONTEXTS.has(contextRaw) ? contextRaw : 'misc';

  const bucketRaw  = String(Array.isArray(fields.bucket) ? fields.bucket[0] : fields.bucket || 'media').toLowerCase();
  const bucket     = ALLOWED_BUCKETS.has(bucketRaw) ? bucketRaw : 'media';

  const jobId = Array.isArray(fields.job_id) ? fields.job_id[0] : fields.job_id;
  const jobSegment = jobId && /^\d+$/.test(String(jobId)) ? `/job-${jobId}` : '';

  const uuid = crypto.randomBytes(8).toString('hex');
  const ext  = extFromMime(mime);
  const path = `${customerId}${jobSegment}/${context}/${uuid}.${ext}`;

  let buffer;
  try {
    buffer = fs.readFileSync(file.filepath);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read upload temp file' });
  } finally {
    try { fs.unlinkSync(file.filepath); } catch {}
  }

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mime, upsert: false, cacheControl: '3600' });

  if (upErr) {
    console.error('[media/upload] storage error', upErr);
    return res.status(500).json({ error: `Storage upload failed: ${upErr.message}` });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return res.status(201).json({
    url:  urlData?.publicUrl || null,
    path,
    bucket,
    size: file.size,
    mime,
    context,
  });
}
