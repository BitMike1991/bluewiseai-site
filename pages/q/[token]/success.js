/**
 * /q/[token]/success — Post-signature success page with Interac deposit instructions
 *
 * Shows: contract signed confirmation, 35% deposit amount, Interac email + copy button,
 * 4-step timeline, balance info, Jérémy contact, print contract button.
 * Mobile-first — client likely opens on iPhone after signing.
 *
 * Interac security question is NOT shown here — Jérémy sends it manually via SMS.
 * Interac email sourced from customers.interac_email (preferred) or fallback const.
 */

import { useState } from 'react';

const NAVY = '#2A2C35';
const SAGE = '#E9EFE7';
const ICE = '#F5F7F4';
const GREEN = '#16a34a';
const INTERAC_EMAIL_FALLBACK = 'purconstructionrenovation@gmail.com';
const PHONE = '(514) 926-7669';

const SB_URL_DEFAULT = 'https://xwhqkgsurssixjadzklb.supabase.co';

// Quebec-style number format: 12 232,15 $
function fmtQc(amount) {
  return Number(amount).toLocaleString('fr-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '\u00a0$';
}

function fmtDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('fr-CA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

async function sbFetch(path, key) {
  const res = await fetch(`${process.env.SUPABASE_URL || SB_URL_DEFAULT}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  if (!res.ok) throw new Error(`Supabase ${path} failed: ${res.status}`);
  return res.json();
}

export async function getServerSideProps({ params, req }) {
  const { token } = params;
  const quoteNumber = token;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Fetch quote
  let quotes;
  try {
    quotes = await sbFetch(
      `quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}&select=id,quote_number,total_ttc,subtotal,status,meta,job_id&limit=1`,
      SB_KEY
    );
  } catch (err) {
    console.error('[success] quote fetch error', err);
    return { notFound: true };
  }

  const quoteRow = quotes?.[0];
  if (!quoteRow || quoteRow.status !== 'accepted') {
    return { notFound: true };
  }

  // 2. Fetch job
  let jobs;
  try {
    jobs = await sbFetch(
      `jobs?id=eq.${quoteRow.job_id}&select=id,client_name,customer_id&limit=1`,
      SB_KEY
    );
  } catch (err) {
    console.error('[success] job fetch error', err);
  }
  const job = jobs?.[0];

  // 3. Fetch customer (PUR = customer_id 9)
  let customers;
  try {
    customers = await sbFetch(
      `customers?id=eq.9&select=id,quote_config,interac_email&limit=1`,
      SB_KEY
    );
  } catch (err) {
    console.error('[success] customer fetch error', err);
  }
  const customer = customers?.[0];

  const quoteConfig = customer?.quote_config || {};
  const paymentSchedule = quoteConfig.payment_schedule || [];
  const depositPct = Number(paymentSchedule[0]?.percentage || 35);
  const subtotal = Number(quoteRow.subtotal || 0);
  const depositTtc = Math.round(subtotal * (depositPct / 100) * 1.14975 * 100) / 100;
  const balancePct = 100 - depositPct;
  const balanceTtc = Math.round(subtotal * (balancePct / 100) * 1.14975 * 100) / 100;

  // 4. Fetch contract
  let contracts;
  try {
    contracts = await sbFetch(
      `contracts?job_id=eq.${quoteRow.job_id}&select=signature_request_id,signature_status,signed_at&order=created_at.desc&limit=1`,
      SB_KEY
    );
  } catch (err) {
    console.error('[success] contract fetch error', err);
  }
  const contractRow = contracts?.[0];

  // 5. Log success_page_viewed (fire and forget — non-blocking)
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  fetch(`${process.env.SUPABASE_URL || SB_URL_DEFAULT}/rest/v1/job_events`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json', Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      job_id: quoteRow.job_id, customer_id: 9,
      event_type: 'success_page_viewed',
      payload: { viewed_at: new Date().toISOString(), ip, quote_number: quoteNumber }
    })
  }).catch(() => {});

  const interacEmail = customer?.interac_email || INTERAC_EMAIL_FALLBACK;

  return {
    props: {
      quoteNumber,
      clientName: job?.client_name || '',
      depositPct,
      depositTtc,
      balancePct,
      balanceTtc,
      contractNumber: contractRow?.signature_request_id || null,
      signedAt: contractRow?.signed_at ? fmtDate(contractRow.signed_at) : null,
      isContractSigned: contractRow?.signature_status === 'signed',
      interacEmail,
    }
  };
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const doCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(doCopy).catch(() => {
        fallbackCopy(text, doCopy);
      });
    } else {
      fallbackCopy(text, doCopy);
    }
  }

  function fallbackCopy(str, cb) {
    const el = document.createElement('textarea');
    el.value = str;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); cb(); } catch (e) {}
    document.body.removeChild(el);
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 14px', fontSize: 12, fontWeight: 700,
        background: copied ? GREEN : NAVY, color: 'white',
        border: 'none', borderRadius: 6, cursor: 'pointer',
        transition: 'background 200ms', marginLeft: 10, flexShrink: 0,
        minWidth: 72,
      }}
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  );
}

// ─── Timeline step ────────────────────────────────────────────────────────────

function TimelineStep({ done, active, label, index }) {
  const bg = done ? GREEN : active ? '#dbeafe' : '#f3f4f6';
  const border = done ? GREEN : active ? '#93c5fd' : '#e5e7eb';
  const numColor = done ? 'white' : active ? '#1d4ed8' : '#9ca3af';
  const labelColor = done ? NAVY : active ? NAVY : '#9ca3af';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: bg, border: `2px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: numColor, flexShrink: 0,
      }}>
        {done ? '✓' : index}
      </div>
      <span style={{ fontSize: 14, color: labelColor, fontWeight: done || active ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function SuccessPage({
  quoteNumber, clientName, depositPct, depositTtc, balancePct, balanceTtc,
  contractNumber, signedAt, isContractSigned, interacEmail
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: ${ICE}; color: ${NAVY}; -webkit-font-smoothing: antialiased; }
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 48 }}>

        {/* HEADER */}
        <div style={{
          background: NAVY, color: 'white',
          padding: '32px 24px 28px', textAlign: 'center',
          borderBottom: `4px solid ${GREEN}`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', opacity: 0.6,
            marginBottom: 12, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase'
          }}>
            PÜR Construction &amp; Rénovation
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: GREEN,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
          }}>
            ✓
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, marginBottom: 8,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            Contrat signé avec succès
          </h1>
          {clientName && (
            <p style={{ fontSize: 15, opacity: 0.8 }}>
              Merci {clientName}&nbsp;! Votre contrat est officiel.
            </p>
          )}
        </div>

        <div style={{ padding: '0 16px' }}>

          {/* DEPOSIT CARD */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 24, marginTop: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `2px solid ${GREEN}`,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', opacity: 0.55, marginBottom: 8,
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              Montant du dépôt requis
            </p>
            <p style={{
              fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em',
              color: NAVY, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace'
            }}>
              {fmtQc(depositTtc)}
            </p>
            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
              {depositPct}&nbsp;% du sous-total, taxes incluses (TPS + TVQ)
            </p>
          </div>

          {/* INTERAC INSTRUCTIONS */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 24, marginTop: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${NAVY}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>💳</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Virement Interac</h2>
            </div>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 14 }}>
              Transférez le dépôt à l&apos;adresse ci-dessous&nbsp;:
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: ICE, padding: '12px 14px', borderRadius: 8, marginBottom: 14,
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700,
                color: NAVY, wordBreak: 'break-all',
              }}>
                {interacEmail}
              </span>
              <CopyButton text={interacEmail} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderTop: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Montant exact&nbsp;:</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 15, fontWeight: 700, color: NAVY
              }}>
                {fmtQc(depositTtc)}
              </span>
            </div>
          </div>

          {/* TIMELINE */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 24, marginTop: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <h2 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', opacity: 0.55, marginBottom: 18,
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              Prochaines étapes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TimelineStep done index={1} label="Devis signé" />
              <TimelineStep active index={2} label="Dépôt Interac reçu" />
              <TimelineStep index={3} label="Mesures et commande des matériaux" />
              <TimelineStep index={4} label="Installation planifiée" />
            </div>
          </div>

          {/* BALANCE */}
          <div style={{
            background: SAGE, borderRadius: 12, padding: 18, marginTop: 16,
            fontSize: 13, color: NAVY,
          }}>
            <strong>Solde de {fmtQc(balanceTtc)}</strong> ({balancePct}&nbsp;%) payable 24&nbsp;h avant
            l&apos;installation par virement Interac également.
          </div>

          {/* CONTACT */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 20, marginTop: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
              Questions? Appelez Jérémy&nbsp;:
            </p>
            <a
              href={`tel:${PHONE.replace(/\D/g, '')}`}
              style={{
                fontSize: 20, fontWeight: 800, color: NAVY,
                textDecoration: 'none', letterSpacing: '-0.01em'
              }}
            >
              {PHONE}
            </a>
          </div>

          {/* DOWNLOAD — pulls the actual signed contract HTML from Supabase
              Storage (via /api/contrat/[token]/download) instead of printing
              this confirmation page. Client gets the full signed contract
              with their signature + Jérémy's already embedded. */}
          <div style={{ marginTop: 16, textAlign: 'center' }} className="no-print">
            <a
              href={`/api/contrat/${encodeURIComponent(quoteNumber)}/download`}
              style={{
                display: 'block',
                padding: '14px 28px', fontSize: 14, fontWeight: 700,
                background: NAVY, color: 'white',
                borderRadius: 8, textDecoration: 'none', width: '100%',
                boxSizing: 'border-box',
              }}
            >
              Télécharger mon contrat signé
            </a>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              Fichier HTML — ouvrez-le dans votre navigateur et utilisez
              « Imprimer → Enregistrer en PDF » si vous souhaitez un PDF.
            </p>
          </div>

          {/* FOOTER */}
          {(contractNumber || signedAt) && (
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#9ca3af' }}>
              {contractNumber && <>Contrat n°&nbsp;{contractNumber}</>}
              {contractNumber && signedAt && ' · '}
              {signedAt && <>Signé le {signedAt}</>}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
