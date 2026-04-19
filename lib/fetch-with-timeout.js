// lib/fetch-with-timeout.js
// Wrap `fetch` with an AbortController + explicit timeout so slow or
// hanging upstream services (n8n webhooks, third-party APIs) don't block
// the response to a real user request.

/**
 * @param {string} url
 * @param {RequestInit} [opts]
 * @param {number} [timeoutMs=4000]
 * @returns {Promise<Response>}
 * @throws Error with .name === 'AbortError' on timeout
 */
export async function fetchWithTimeout(url, opts = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
