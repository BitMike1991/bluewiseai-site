/**
 * /q/[token] — Public quote viewer for PÜR clients
 *
 * SSR: fetches HTML from BW universal/devis/render on every request (no html_content column).
 * Normal case: sends raw HTML directly via res.write() — bypasses React render entirely.
 * Error/expired/accepted: returns props and renders small React state pages.
 *
 * Tracking script injected before </body> on the raw HTML path:
 *   - opened: fires once on load
 *   - heartbeat: fires every 10s while tab is visible
 *   - accept_clicked: fires when user clicks .btn-accept or [data-accept]
 */

import Head from 'next/head';

const BW_RENDER_URL = 'https://www.bluewiseai.com/api/universal/devis/render';

function buildTrackingScript(quoteNumber) {
  // All single-quotes escaped, no template literals inside the injected script
  return `
<script>
(function(){
  var QN='${quoteNumber.replace(/'/g, "\\'")}';
  var tracked={};
  function track(event,extra){
    extra=extra||{};
    var body=Object.assign({quote_number:QN,event:event},extra);
    fetch('/api/devis/track',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body),
      keepalive:true
    }).catch(function(){});
  }
  if(!tracked.opened){tracked.opened=true;track('opened',{referrer:document.referrer||null});}
  var startTs=Date.now();
  var maxScroll=0;
  function scrollPct(){
    var doc=document.documentElement;
    var top=document.body.scrollTop||doc.scrollTop;
    var h=Math.max(doc.scrollHeight,document.body.scrollHeight)-window.innerHeight;
    if(h<=0)return 100;
    return Math.round(Math.min(100,Math.max(0,(top/h)*100)));
  }
  window.addEventListener('scroll',function(){
    var p=scrollPct();
    if(p>maxScroll)maxScroll=p;
  },{passive:true});

  // Accept flow: POST to BW universal API → redirect to /sign or /success
  window.acceptQuote=async function(){
    var btn=document.querySelector('.btn-accept,[data-accept]');
    if(btn){btn.disabled=true;btn.textContent='Acceptation en cours...';}
    track('accept_clicked');
    try{
      var resp=await fetch('https://www.bluewiseai.com/api/universal/devis/accept',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quote_number:QN})
      });
      var data=await resp.json();
      if(resp.ok&&data.success){
        if(data.contract_url){
          window.location.href=data.contract_url;
        }else{
          window.location.href='/q/'+QN+'/success';
        }
      }else{
        alert('Erreur: '+(data.error||'Réessayez ou appelez (514) 926-7669'));
        if(btn){btn.disabled=false;btn.textContent='Accepter ce devis \u2192';}
      }
    }catch(err){
      alert('Erreur réseau. Appelez Jérémy au (514) 926-7669');
      if(btn){btn.disabled=false;btn.textContent='Accepter ce devis \u2192';}
    }
  };

  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('.btn-accept,[data-accept]');
    if(t){e.preventDefault();window.acceptQuote();}
  });
})();
</script>
`.trim();
}

export async function getServerSideProps({ params, res }) {
  const { token } = params;
  const quoteNumber = token;

  let data;
  try {
    const resp = await fetch(
      `${BW_RENDER_URL}?quote_number=${encodeURIComponent(quoteNumber)}`,
      { method: 'GET' }
    );
    if (resp.status === 404) return { notFound: true };
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      return {
        props: {
          error: errBody.error || 'Erreur serveur',
          quoteNumber,
        },
      };
    }
    data = await resp.json();
  } catch (err) {
    console.error('[q/[token]] SSR fetch error', err);
    return { props: { error: 'Erreur réseau', quoteNumber } };
  }

  const { html, status, expired, client_name, valid_until } = data;

  // State pages (error / expired / accepted) — let React render them
  if (status === 'expired' || expired) {
    return {
      props: { quoteState: 'expired', quoteNumber, validUntil: valid_until || null },
    };
  }
  if (status === 'accepted') {
    return {
      props: { quoteState: 'accepted', quoteNumber, clientName: client_name || '' },
    };
  }
  if (status === 'draft' || status === 'superseded') {
    return {
      props: { quoteState: 'unavailable', quoteNumber },
    };
  }

  // Normal case (ready): bypass React, send full HTML document directly
  const trackingScript = buildTrackingScript(quoteNumber);
  const htmlWithTracking = html.includes('</body>')
    ? html.replace('</body>', trackingScript + '\n</body>')
    : html + trackingScript;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'no-store');
  res.write(htmlWithTracking);
  res.end();

  // Return empty props — component below never mounts for this path
  return { props: {} };
}

// ─── React component — only renders for state pages (error/expired/accepted) ───

export default function QuotePage({ quoteState, quoteNumber, validUntil, clientName, error }) {
  if (error) {
    return <ErrorShell quoteNumber={quoteNumber} message={error} />;
  }
  if (quoteState === 'expired') {
    return <ExpiredShell quoteNumber={quoteNumber} validUntil={validUntil} />;
  }
  if (quoteState === 'accepted') {
    return <AcceptedShell quoteNumber={quoteNumber} clientName={clientName} />;
  }
  if (quoteState === 'unavailable') {
    return <UnavailableShell quoteNumber={quoteNumber} />;
  }
  // Empty — normal HTML path was served directly via res.write in getServerSideProps
  return null;
}

// ─── State shells ────────────────────────────────────────────────────────────

const NAVY = '#2A2C35';
const SAGE = '#E9EFE7';
const PHONE = '(514) 926-7669';

function Shell({ children }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <title>Devis PÜR Construction</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f0; min-height: 100vh; }
          .shell { max-width: 480px; margin: 0 auto; padding: 48px 24px; text-align: center; }
          .logo { font-size: 22px; font-weight: 800; color: ${NAVY}; letter-spacing: 2px; margin-bottom: 32px; }
          .card { background: white; border-radius: 12px; padding: 32px 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
          .phone-link { display: inline-block; margin-top: 16px; font-size: 18px; font-weight: 700; color: ${NAVY}; text-decoration: none; }
          .phone-link:hover { text-decoration: underline; }
          .qn { font-size: 12px; color: #9ca3af; margin-top: 20px; }
        `}</style>
      </Head>
      <div className="shell">
        <div className="logo">PÜR</div>
        <div className="card">{children}</div>
      </div>
    </>
  );
}

function ErrorShell({ quoteNumber, message }) {
  return (
    <Shell>
      <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
        Impossible d&apos;afficher ce devis
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
        {message}
      </p>
      <p style={{ fontSize: 14, color: '#374151' }}>
        Contactez-nous directement :
      </p>
      <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="phone-link">{PHONE}</a>
      {quoteNumber && <p className="qn">Réf : {quoteNumber}</p>}
    </Shell>
  );
}

function ExpiredShell({ quoteNumber, validUntil }) {
  const dateStr = validUntil
    ? new Date(validUntil).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  return (
    <Shell>
      <div style={{
        background: '#fef2f2', border: '2px solid #ef4444',
        borderRadius: 8, padding: '16px 20px', marginBottom: 20
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>
          Devis expiré
        </p>
        {dateStr && (
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Ce devis était valide jusqu&apos;au {dateStr}.
          </p>
        )}
      </div>
      <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
        Vous désirez toujours aller de l&apos;avant ? Appelez-nous pour un nouveau devis à jour.
      </p>
      <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="phone-link">{PHONE}</a>
      {quoteNumber && <p className="qn">Réf : {quoteNumber}</p>}
    </Shell>
  );
}

function AcceptedShell({ quoteNumber, clientName }) {
  return (
    <Shell>
      <div style={{
        background: '#ecfdf5', border: '2px solid #10b981',
        borderRadius: 8, padding: '16px 20px', marginBottom: 20
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#047857' }}>
          ✅ Devis déjà accepté
        </p>
        {clientName && (
          <p style={{ fontSize: 13, color: '#065f46', marginTop: 4 }}>
            Merci {clientName} ! Votre dossier est en cours.
          </p>
        )}
      </div>
      <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
        Questions sur votre projet ? Appelez Jérémy :
      </p>
      <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="phone-link">{PHONE}</a>
      {quoteNumber && <p className="qn">Réf : {quoteNumber}</p>}
    </Shell>
  );
}

function UnavailableShell({ quoteNumber }) {
  return (
    <Shell>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔒</p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
        Devis non disponible
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
        Ce devis n&apos;est pas encore prêt pour consultation.
      </p>
      <p style={{ fontSize: 14, color: '#374151' }}>
        Contactez Jérémy directement :
      </p>
      <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="phone-link">{PHONE}</a>
      {quoteNumber && <p className="qn">Réf : {quoteNumber}</p>}
    </Shell>
  );
}
