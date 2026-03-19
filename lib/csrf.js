// lib/csrf.js
// CSRF protection via X-Requested-With header check.
// Browsers block cross-origin JS from setting custom headers on form POSTs.
// This simple check defeats cross-site form submission attacks.

/**
 * Verify CSRF protection on state-changing requests.
 * Returns true if the request should be BLOCKED (failed CSRF check).
 *
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 * @returns {boolean} true if blocked (caller should return)
 */
export function checkCsrf(req, res) {
  // Only check state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return false;
  }

  // Allow server-to-server calls with CRON_SECRET
  if (req.headers["x-cron-secret"]) {
    return false;
  }

  // Verify Origin or Referer header matches our domain
  const origin = req.headers["origin"];
  const referer = req.headers["referer"];
  const allowed = [
    "https://bluewiseai.com",
    "https://www.bluewiseai.com",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  if (origin && allowed.some((a) => origin.startsWith(a))) {
    return false;
  }

  if (referer && allowed.some((a) => referer.startsWith(a))) {
    return false;
  }

  // If neither origin nor referer is present (e.g., server-to-server, curl),
  // check for the X-Requested-With header that our frontend always sends
  if (req.headers["x-requested-with"] === "XMLHttpRequest") {
    return false;
  }

  // Block: no valid origin, referer, or XMLHttpRequest header
  res.status(403).json({ error: "Forbidden — invalid request origin" });
  return true;
}
