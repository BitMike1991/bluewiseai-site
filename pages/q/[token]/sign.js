/**
 * /q/[token]/sign — Contract signature page for PÜR clients
 *
 * SSR: fetches contract html_content from DB (joined via quotes.quote_number = token).
 * Streams the full HTML document directly — bypasses React render (same as /q/[token]).
 * The contract HTML from contrat/create already has signature_pad canvas wired to
 * https://www.bluewiseai.com/api/universal/contrat/sign.
 *
 * We inject a post-sign redirect script so the client lands on /q/[token]/success.
 */

import { sbSelect, sbInsert } from '../../../lib/supabase-server.js';

const NAVY = '#2A2C35';
const PHONE = '(514) 926-7669';

export async function getServerSideProps({ params, res }) {
  const { token } = params;
  const quoteNumber = token;

  // 1. Resolve job_id from quote_number
  let quoteRows;
  try {
    quoteRows = await sbSelect('quotes', {
      match: { quote_number: quoteNumber },
      columns: 'job_id,status',
      limit: 1,
    });
  } catch (err) {
    console.error('[sign] quote lookup error', err);
    return { props: { error: 'Erreur serveur', quoteNumber } };
  }

  if (!quoteRows || quoteRows.length === 0) {
    return { notFound: true };
  }

  const quoteRow = quoteRows[0];

  // 2. Fetch most recent contract for this job
  // sbSelect uses eq filters — order by created_at desc via custom fetch
  const SB_URL = process.env.SUPABASE_URL || 'https://xwhqkgsurssixjadzklb.supabase.co';
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let contractRow = null;
  try {
    const contractResp = await fetch(
      `${SB_URL}/rest/v1/contracts?job_id=eq.${quoteRow.job_id}&select=id,signature_status,html_content,signature_request_id,job_id,customer_id&order=created_at.desc&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } }
    );
    const contracts = await contractResp.json();
    contractRow = contracts?.[0] || null;
  } catch (err) {
    console.error('[sign] contract lookup error', err);
  }

  // 3. No contract yet → quote hasn't been accepted or contract not created
  if (!contractRow) {
    return {
      redirect: { destination: `/q/${quoteNumber}`, permanent: false }
    };
  }

  // 4. Already signed → go straight to success
  if (contractRow.signature_status === 'signed') {
    return {
      redirect: { destination: `/q/${quoteNumber}/success`, permanent: false }
    };
  }

  // 5. No HTML content stored → error shell
  if (!contractRow.html_content) {
    return {
      props: { error: 'Contrat en cours de préparation. Réessayez dans quelques instants.', quoteNumber }
    };
  }

  // 6. Stream contract HTML with post-sign redirect injector
  // The BW contract HTML calls /api/universal/contrat/sign on BW domain via its own JS.
  // We monkey-patch fetch to intercept the successful sign response and redirect to /success.
  const qnSafe = quoteNumber.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const redirectScript = `
<script>
(function(){
  var _origFetch=window.fetch;
  window.fetch=function(url,opts){
    if(typeof url==='string'&&url.includes('/api/universal/contrat/sign')){
      return _origFetch(url,opts).then(function(resp){
        resp.clone().json().then(function(data){
          if(data&&data.success){
            setTimeout(function(){window.location.href='/q/${qnSafe}/success';},2200);
          }
        }).catch(function(){});
        return resp;
      });
    }
    return _origFetch(url,opts);
  };
})();
</script>`.trim();

  const html = contractRow.html_content;
  const htmlWithRedirect = html.includes('</body>')
    ? html.replace('</body>', redirectScript + '\n</body>')
    : html + redirectScript;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'no-store');
  res.write(htmlWithRedirect);
  res.end();

  return { props: {} };
}

// ─── React component — only renders for error fallback ───────────────────────

export default function SignPage({ error, quoteNumber }) {
  if (!error) return null; // normal path: HTML was streamed directly

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', background: '#f5f5f0', minHeight: '100vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, letterSpacing: 2, marginBottom: 32 }}>PÜR</div>
        <div style={{ background: 'white', borderRadius: 12, padding: '32px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 20, marginBottom: 12, color: NAVY }}>Contrat non disponible</p>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>{error}</p>
          <p style={{ fontSize: 14, color: '#374151' }}>Contactez Jérémy :</p>
          <a
            href={`tel:${PHONE.replace(/\D/g, '')}`}
            style={{ display: 'inline-block', marginTop: 16, fontSize: 18, fontWeight: 700, color: NAVY, textDecoration: 'none' }}
          >
            {PHONE}
          </a>
          {quoteNumber && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 20 }}>Réf : {quoteNumber}</p>
          )}
        </div>
      </div>
    </div>
  );
}
