// lib/payroll/sin-crypto.js
// AES-256-GCM encryption for SINs.
//
// Requires env var PAYROLL_SIN_KEY (32-byte hex string). Generate once with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// and add to Vercel env (+ local .env.local).
//
// Format stored in DB: "<iv_hex>:<tag_hex>:<ciphertext_hex>"

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey() {
  const hex = process.env.PAYROLL_SIN_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('PAYROLL_SIN_KEY missing or wrong length (need 32-byte hex = 64 chars)');
  }
  return Buffer.from(hex, 'hex');
}

function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

export function encryptSin(sin) {
  if (!sin) return null;
  const digits = digitsOnly(sin);
  if (digits.length !== 9) {
    throw new Error('SIN must be 9 digits');
  }
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(digits, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptSin(payload) {
  if (!payload) return null;
  const parts = String(payload).split(':');
  if (parts.length !== 3) throw new Error('Malformed SIN ciphertext');
  const [ivHex, tagHex, encHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

// Never show full SIN — mask to last 3 digits
export function maskSin(sin) {
  const d = digitsOnly(sin);
  if (d.length !== 9) return '•••–•••–•••';
  return `•••–•••–${d.slice(-3)}`;
}

// Luhn check for Canadian SIN (catches typos before encryption)
export function isValidSinFormat(sin) {
  const d = digitsOnly(sin);
  if (d.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(d[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
