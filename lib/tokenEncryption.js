// lib/tokenEncryption.js
// AES-256-GCM encryption for OAuth tokens at rest
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const key = process.env.OAUTH_ENCRYPTION_KEY || process.env.HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Derive a 32-byte key from whatever secret we have
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a plaintext string.
 * @returns {string} base64-encoded ciphertext (iv + tag + encrypted)
 */
export function encryptToken(plaintext) {
  if (!plaintext) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack: iv (12) + tag (16) + encrypted (N)
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64-encoded ciphertext.
 * @returns {string|null} plaintext or null on failure
 */
export function decryptToken(ciphertext) {
  if (!ciphertext) return null;
  try {
    const key = getKey();
    const buf = Buffer.from(ciphertext, "base64");
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const encrypted = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
}
