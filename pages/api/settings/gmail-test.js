// pages/api/settings/gmail-test.js
// Live probe of the Gmail OAuth pipeline for the authed customer.
//
// GET /api/settings/gmail-test
//   → { connected, email, token_expiry, refresh: { success, error?, new_access_token_len? } }
//
// Used to debug send failures: if refresh fails, the response surfaces the
// verbatim Google OAuth error (invalid_grant means the refresh_token was
// revoked — user needs to reconnect Gmail in settings).

import { getAuthContext, getSupabaseServerClient } from '../../../lib/supabaseServer';
import { decryptToken, encryptToken } from '../../../lib/tokenEncryption';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, customerId } = await getAuthContext(req, res);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  const admin = getSupabaseServerClient();
  const { data: row } = await admin
    .from('customer_email_oauth')
    .select('id, provider, email_address, status, access_token, refresh_token, token_expiry, updated_at, created_at')
    .eq('customer_id', customerId)
    .eq('provider', 'gmail')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return res.status(200).json({ connected: false, reason: 'no_row' });
  }

  const base = {
    connected: row.status === 'active',
    email: row.email_address,
    status: row.status,
    token_expiry: row.token_expiry,
    expired: row.token_expiry ? new Date(row.token_expiry) < new Date() : null,
    updated_at: row.updated_at,
    created_at: row.created_at,
  };

  // Attempt to refresh — mirrors lib/providers/gmail.js refreshAccessToken
  // but surfaces the verbatim response so Mikael can see whether the
  // refresh_token was revoked (invalid_grant) vs an encryption mismatch
  // (decryptToken returns null) vs a client_id misconfig.
  if (!row.refresh_token) {
    return res.status(200).json({ ...base, refresh: { attempted: false, reason: 'no_refresh_token' } });
  }

  const rt = decryptToken(row.refresh_token);
  if (!rt) {
    return res.status(200).json({
      ...base,
      refresh: {
        attempted: false,
        reason: 'decrypt_failed',
        hint: 'OAUTH_ENCRYPTION_KEY mismatch between encrypt and decrypt',
      },
    });
  }

  try {
    const resp = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: rt,
        grant_type: 'refresh_token',
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data.access_token) {
      return res.status(200).json({
        ...base,
        refresh: {
          attempted: true,
          success: false,
          http_status: resp.status,
          google_error: data.error || null,
          google_error_description: data.error_description || null,
        },
      });
    }

    // Refresh succeeded — persist the new access token so the next real
    // send uses it without round-tripping Google again.
    const newExpiry = new Date(Date.now() + (Number(data.expires_in) || 3500) * 1000).toISOString();
    try {
      await admin
        .from('customer_email_oauth')
        .update({
          access_token: encryptToken(data.access_token),
          token_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    } catch (persistErr) {
      return res.status(200).json({
        ...base,
        refresh: {
          attempted: true,
          success: true,
          new_access_token_len: String(data.access_token).length,
          expires_in: data.expires_in,
          persist_error: persistErr?.message || 'unknown',
        },
      });
    }

    return res.status(200).json({
      ...base,
      token_expiry: newExpiry,
      refresh: {
        attempted: true,
        success: true,
        new_access_token_len: String(data.access_token).length,
        expires_in: data.expires_in,
      },
    });
  } catch (err) {
    return res.status(200).json({
      ...base,
      refresh: {
        attempted: true,
        success: false,
        network_error: err?.message || 'unknown',
      },
    });
  }
}
