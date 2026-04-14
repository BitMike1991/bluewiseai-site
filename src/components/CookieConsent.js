import { useState, useEffect } from 'react';

const CONSENT_KEY = 'bw_cookie_consent';

export function getCookieConsent() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch { return null; }
}

export function hasConsented(category = 'analytics') {
  const c = getCookieConsent();
  if (!c) return false;
  return !!c[category];
}

export default function CookieConsent({ privacyUrl = '/privacy' }) {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function save(prefs) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ essential: true, ...prefs }));
    setVisible(false);
    setShowPrefs(false);
    window.dispatchEvent(new Event('cookie-consent-changed'));
  }

  function acceptAll() {
    save({ analytics: true, marketing: true });
  }

  function savePrefs() {
    save({ analytics, marketing });
  }

  if (!visible) return null;

  const overlay = {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
    background: '#1a1a2e', color: '#fff',
    boxShadow: '0 -2px 20px rgba(0,0,0,0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };

  const btnPrimary = {
    background: '#4f8cff', color: '#fff', border: 'none',
    padding: '12px 28px', borderRadius: 6, fontWeight: 600,
    fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap'
  };

  const btnSecondary = {
    background: 'transparent', color: '#ccc', border: '1px solid #555',
    padding: '12px 28px', borderRadius: 6, fontWeight: 600,
    fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap'
  };

  if (showPrefs) {
    return (
      <div style={overlay}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 24px 20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Préférences de cookies</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
              <input type="checkbox" checked disabled style={{ width: 18, height: 18, accentColor: '#4f8cff' }} />
              <div>
                <strong>Essentiels</strong>
                <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>Toujours actifs — nécessaires au fonctionnement du site</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#4f8cff' }} />
              <div>
                <strong>Analytiques</strong>
                <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>Nous aident à comprendre comment vous utilisez le site</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#4f8cff' }} />
              <div>
                <strong>Marketing</strong>
                <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>Permettent de mesurer l'efficacité de nos publicités</div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={savePrefs} style={btnPrimary}>Enregistrer mes choix</button>
            <button onClick={acceptAll} style={btnSecondary}>Tout accepter</button>
          </div>

          <a href={privacyUrl} style={{ display: 'inline-block', marginTop: 12, color: '#8ec5fc', fontSize: 12, textDecoration: 'underline' }}>
            Politique de confidentialité
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px 20px' }}>
        <p style={{ margin: 0, maxWidth: 520, fontSize: 14, lineHeight: 1.5, textAlign: 'center' }}>
          Ce site utilise des cookies pour améliorer votre expérience et mesurer l'audience.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={acceptAll} style={btnPrimary}>Accepter</button>
          <button onClick={() => setShowPrefs(true)} style={btnSecondary}>Personnaliser</button>
        </div>
      </div>
    </div>
  );
}
