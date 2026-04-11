import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const fmtCAD = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });

export default function RoofQuoteViewer() {
  const router = useRouter();
  const { token } = router.query;
  const [code, setCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/roof-quote/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        setLoading(false);
        return;
      }
      setQuote(data.quote);
    } catch (err) {
      setError('Erreur de connexion');
    }
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Devis toiture — BlueWise Roofing</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        :root {
          --navy: #2A2C35;
          --navy-light: #3A3D47;
          --sage: #E9EFE7;
          --sage-dark: #D8E0D4;
          --sage-light: #F2F5F0;
          --ice: #F5F7F4;
          --mist: #F0F1F3;
          --pure: #FFFFFF;
          --text-muted: #6b7280;
          --border: #e5e7eb;
          --red: #dc2626;
          --red-light: #fee2e2;
          --green: #16a34a;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--ice);
          color: var(--navy);
          -webkit-font-smoothing: antialiased;
        }
        h1, h2, h3, h4 { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
      `}</style>

      {!quote ? <Gate {...{ code, setCode, handleVerify, loading, error }} /> : <DevisBody quote={quote} />}
    </>
  );
}

function Gate({ code, setCode, handleVerify, loading, error }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ background: 'var(--navy)', color: 'var(--pure)', padding: '24px 28px', borderRadius: '8px 8px 0 0' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', opacity: 0.6, textTransform: 'uppercase' }}>
            BlueWise Roofing
          </div>
          <h1 style={{ fontSize: 22, marginTop: 6 }}>Accès sécurisé</h1>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Votre devis toiture</div>
        </div>
        <form
          onSubmit={handleVerify}
          style={{ background: 'var(--pure)', padding: 28, borderRadius: '0 0 8px 8px', boxShadow: '0 2px 18px rgba(0,0,0,0.08)' }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Les 4 derniers chiffres de votre téléphone
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            autoFocus
            style={{
              width: '100%',
              padding: '16px 18px',
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: '0.3em',
              fontFamily: 'monospace',
              border: '2px solid var(--border)',
              borderRadius: 6,
              color: 'var(--navy)',
              background: 'var(--ice)',
            }}
          />
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: 'var(--red-light)',
                color: 'var(--red)',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={code.length !== 4 || loading}
            style={{
              width: '100%',
              marginTop: 18,
              padding: '14px 20px',
              background: code.length === 4 ? 'var(--navy)' : 'var(--border)',
              color: 'var(--pure)',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: code.length === 4 ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Vérification…' : 'Accéder au devis'}
          </button>
          <div
            style={{
              marginTop: 18,
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Ce lien est personnel et sécurisé. Si vous avez reçu ce lien par erreur, ignorez-le.
          </div>
        </form>
      </div>
    </div>
  );
}

function DevisBody({ quote }) {
  const payload = quote.payload || {};
  const result = payload.result || {};
  const measures = payload.measures || {};
  const labor = payload.labor || {};
  const client = quote.client || {};

  const today = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const expiresStr = quote.expires_at ? new Date(quote.expires_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const total = fmtCAD.format(Number(quote.total_client_ttc || 0));
  const subHT = fmtCAD.format(Number(result.revenue_ht || 0));
  const tps = fmtCAD.format(Number(result.tax_gst || 0));
  const tvq = fmtCAD.format(Number(result.tax_qst || 0));

  const PITCH_LABELS = {
    easy: 'Pente facile (4/12 ou moins)',
    medium: 'Pente standard (4/12 – 6/12)',
    hard: 'Pente accentuée (6/12 – 8/12)',
    extreme: 'Pente extrême (8/12 et plus)',
  };

  const SHINGLE_LABELS = {
    bardeau_standard: 'Bardeau IKO Cambridge — 25 ans',
    bardeau_target_50: 'Bardeau Target 50 ans',
    bardeau_target_100: 'Bardeau Target 100 ans',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: 'var(--pure)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--navy)', color: 'var(--pure)', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', opacity: 0.6, textTransform: 'uppercase' }}>BlueWise Roofing Inc.</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, marginTop: 4 }}>DEVIS TOITURE</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.7, marginTop: 3 }}>#{(quote.token || '').toUpperCase()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', opacity: 0.6, textTransform: 'uppercase' }}>Total toutes taxes</div>
          <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 800, color: 'var(--sage)', marginTop: 2 }}>{total}</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{quote.surface_sqft} pi² · valide jusqu'au {expiresStr}</div>
        </div>
      </div>

      <div style={{ padding: '28px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>Client</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{client.name}</div>
          {client.address && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{client.address}</div>}
          {client.city && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{client.city}{client.postal ? ` ${client.postal}` : ''}</div>}
          {client.phone && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{client.phone}</div>}
          {client.email && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{client.email}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>Émis le</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{today}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, marginTop: 14, marginBottom: 6 }}>Entrepreneur</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>BlueWise Roofing</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Démo calculateur — bluewiseai.com</div>
        </div>
      </div>

      <div style={{ padding: '28px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 14 }}>Travaux inclus</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
          <Row lbl="Surface de toiture" val={`${quote.surface_sqft} pi²`} />
          <Row lbl="Type de bardeau" val={SHINGLE_LABELS[quote.shingle_type] || quote.shingle_type || '—'} />
          <Row lbl="Pente" val={PITCH_LABELS[quote.pitch_category] || quote.pitch_category || '—'} />
          <Row lbl="Équipe" val={`${labor.workers || 2} travailleurs × ${labor.days || 1} j`} />
        </div>
        <div style={{ marginTop: 20, background: 'var(--sage-light)', padding: 18, borderLeft: '3px solid var(--navy)', borderRadius: 3 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Tout inclus</div>
          <ul style={{ fontSize: 13, paddingLeft: 18, color: 'var(--navy)', lineHeight: 1.7 }}>
            <li>Arrachage complet de la vieille toiture</li>
            <li>Inspection du pontage (remplacement au besoin, extra facturable séparément)</li>
            <li>Installation membrane glace &amp; eau (bas de pente + noues)</li>
            <li>Sous-couche synthétique Syntec haute performance</li>
            <li>Pose bardeau et cap bardeau — garantie manufacturier</li>
            <li>Ventilation (évents / Maximum) selon besoin</li>
            <li>Transport, disposition des rebuts, nettoyage final</li>
            <li>Garantie main d'œuvre entrepreneur</li>
          </ul>
        </div>
      </div>

      <div style={{ padding: '28px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 14 }}>Résumé financier</div>
        <Row lbl="Sous-total hors taxes" val={subHT} />
        <Row lbl="TPS (5 %)" val={tps} />
        <Row lbl="TVQ (9,975 %)" val={tvq} />
        <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>
          <span>Total à payer</span>
          <span>{total}</span>
        </div>
      </div>

      <div style={{ padding: '28px 40px', background: 'var(--sage-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>Conditions</div>
          <ul style={{ fontSize: 12, paddingLeft: 16, lineHeight: 1.7 }}>
            <li>Paiement: 35 % au début, 65 % à la fin des travaux</li>
            <li>Devis valide 60 jours</li>
            <li>Travaux démarrés sous 2-4 semaines après signature</li>
            <li>Garantie manufacturier sur matériaux</li>
          </ul>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>Questions ?</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>BlueWise Roofing</div>
          <div style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>bluewiseai.com</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>contact@bluewiseai.com</div>
        </div>
      </div>

      <div style={{ padding: '20px 40px', background: 'var(--navy)', color: 'var(--pure)', fontSize: 11, textAlign: 'center', opacity: 0.8 }}>
BlueWise Roofing — démo white-label · Calculateur instantané pour entrepreneurs
      </div>
    </div>
  );
}

function Row({ lbl, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
      <span style={{ opacity: 0.7 }}>{lbl}</span>
      <span style={{ fontWeight: 600 }}>{val}</span>
    </div>
  );
}
