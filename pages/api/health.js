// Public health endpoint — Sentinelle api.health probes this.
// No auth. No dependencies. Returns in single-digit ms.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
    build: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    region: process.env.VERCEL_REGION || 'local',
  });
}
