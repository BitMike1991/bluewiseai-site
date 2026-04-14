// pages/api/auth/oauth-code.js
// Simple OAuth callback that displays the authorization code for manual copy
export default function handler(req, res) {
  const { code, error } = req.query;
  if (error) {
    return res.status(400).send(`<h1>OAuth Error</h1><p>${error}</p>`);
  }
  if (!code) {
    return res.status(400).send(`<h1>No code received</h1>`);
  }
  res.status(200).send(`
    <html><body style="font-family:sans-serif;max-width:600px;margin:80px auto;text-align:center;">
    <h1 style="color:#22c55e;">Authorization Complete!</h1>
    <p>Copy this entire URL from your browser bar and paste it in the chat.</p>
    <p style="background:#f1f5f9;padding:16px;border-radius:8px;word-break:break-all;font-size:13px;font-family:monospace;">${code.substring(0,20)}...</p>
    <p style="color:#666;">You can close this tab.</p>
    </body></html>
  `);
}
