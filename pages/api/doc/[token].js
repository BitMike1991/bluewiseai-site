// Private document viewer — token-protected invoices, quotes, contracts.
//
// F-009 (2026-04-20): the hardcoded BW-2026-001 invoice was deleted because
// it shipped real client PII (address, phone, email) and live Interac
// e-transfer security Q&A in source. Interac Q&A was also rotated
// out-of-band at the bank. Route kept as a 404 stub so old URLs fail
// gracefully; re-add DB-backed document lookup here if this surface is
// ever needed again.

const DOCUMENTS = {};

export default function handler(req, res) {
  const { token } = req.query;
  const doc = DOCUMENTS[token];

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (!doc) {
    res.status(404).setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html><head><title>Document introuvable</title>
      <style>
        body { font-family: Inter, sans-serif; background: #0a0a0f; color: #8888aa;
               display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .box { text-align: center; }
        h1 { color: #6c63ff; font-size: 48px; margin-bottom: 8px; }
        p { font-size: 16px; }
      </style></head>
      <body><div class="box"><h1>404</h1><p>Ce document n'existe pas ou le lien a expiré.</p></div></body></html>
    `);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(doc.html());
}
