// DELETED — This endpoint was a CRITICAL security vulnerability (zero auth, exposed all cold recipient data)
// If you need lead export functionality, implement it with proper auth in /api/admin/
export default function handler(req, res) {
  return res.status(410).json({ error: "This endpoint has been removed for security reasons." });
}
