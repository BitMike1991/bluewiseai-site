// Private document viewer — token-protected invoices, quotes, contracts
// Usage: /api/doc/BW-2026-001-xxxx  (token = doc ID + secret suffix)

const DOCUMENTS = {
  'BW-2026-001-j9r4k7': {
    type: 'invoice',
    html: getInvoicePUR001,
  },
};

export default function handler(req, res) {
  const { token } = req.query;
  const doc = DOCUMENTS[token];

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
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.send(doc.html());
}

function getInvoicePUR001() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Facture BW-2026-001 — BlueWise</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0a0a0f;
      color: #e8e8f0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .invoice {
      width: 800px;
      background: #111118;
      border-radius: 24px;
      border: 1px solid #2a2a3a;
      overflow: hidden;
      box-shadow: 0 0 80px rgba(108, 99, 255, 0.08), 0 0 200px rgba(0, 212, 170, 0.04);
    }
    .header {
      background: linear-gradient(135deg, #111118 0%, #1a1a2e 50%, #111118 100%);
      padding: 48px;
      border-bottom: 1px solid #2a2a3a;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%; right: -20%;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(108, 99, 255, 0.12) 0%, transparent 70%);
      border-radius: 50%;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -30%; left: -10%;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(0, 212, 170, 0.08) 0%, transparent 70%);
      border-radius: 50%;
    }
    .header-content {
      position: relative; z-index: 1;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand img { width: 56px; height: 56px; border-radius: 14px; }
    .brand-text h1 {
      font-size: 24px; font-weight: 800;
      background: linear-gradient(135deg, #6c63ff, #00d4aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; letter-spacing: -0.5px;
    }
    .brand-text p {
      font-size: 12px; color: #8888aa; font-weight: 500;
      letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;
    }
    .invoice-badge { text-align: right; }
    .invoice-badge .label {
      font-size: 11px; color: #8888aa; text-transform: uppercase;
      letter-spacing: 3px; font-weight: 600;
    }
    .invoice-badge .number {
      font-size: 28px; font-weight: 800; color: #6c63ff;
      margin-top: 4px; letter-spacing: -1px;
    }
    .invoice-badge .date { font-size: 13px; color: #8888aa; margin-top: 8px; }
    .status {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(0, 212, 170, 0.1); border: 1px solid rgba(0, 212, 170, 0.25);
      padding: 6px 14px; border-radius: 100px;
      font-size: 11px; font-weight: 700; color: #00d4aa;
      text-transform: uppercase; letter-spacing: 2px; margin-top: 12px;
    }
    .status-dot {
      width: 6px; height: 6px; background: #00d4aa;
      border-radius: 50%; animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .parties {
      display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
      padding: 40px 48px; border-bottom: 1px solid #2a2a3a;
    }
    .party-label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 3px;
      color: #6c63ff; font-weight: 700; margin-bottom: 12px;
    }
    .party-name { font-size: 16px; font-weight: 700; color: #e8e8f0; margin-bottom: 8px; }
    .party-details { font-size: 13px; color: #8888aa; line-height: 1.8; }
    .items-section { padding: 40px 48px; border-bottom: 1px solid #2a2a3a; }
    .items-header {
      display: grid; grid-template-columns: 1fr 120px;
      padding: 12px 20px; background: rgba(108, 99, 255, 0.06);
      border-radius: 10px; margin-bottom: 8px;
    }
    .items-header span {
      font-size: 10px; text-transform: uppercase; letter-spacing: 2px;
      color: #8888aa; font-weight: 700;
    }
    .items-header span:last-child { text-align: right; }
    .item {
      display: grid; grid-template-columns: 1fr 120px;
      padding: 20px; border-bottom: 1px solid #1a1a24; transition: background 0.2s;
    }
    .item:hover { background: rgba(108, 99, 255, 0.03); border-radius: 10px; }
    .item:last-child { border-bottom: none; }
    .item-name { font-size: 15px; font-weight: 600; color: #e8e8f0; }
    .item-desc { font-size: 12px; color: #8888aa; margin-top: 4px; }
    .item-amount {
      font-size: 15px; font-weight: 600; color: #e8e8f0;
      text-align: right; display: flex; align-items: center; justify-content: flex-end;
    }
    .totals {
      padding: 32px 48px; display: flex; justify-content: flex-end;
      border-bottom: 1px solid #2a2a3a;
    }
    .totals-box { width: 320px; }
    .total-row {
      display: flex; justify-content: space-between;
      padding: 10px 0; font-size: 14px; color: #8888aa;
    }
    .total-row.subtotal {
      border-bottom: 1px solid #2a2a3a; padding-bottom: 16px; margin-bottom: 8px;
    }
    .total-row.grand {
      border-top: 2px solid #6c63ff; margin-top: 8px; padding-top: 16px;
    }
    .total-row.grand .label { font-size: 16px; font-weight: 800; color: #e8e8f0; }
    .total-row.grand .value {
      font-size: 24px; font-weight: 800;
      background: linear-gradient(135deg, #6c63ff, #00d4aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .payment { padding: 40px 48px; border-bottom: 1px solid #2a2a3a; }
    .payment-title {
      font-size: 10px; text-transform: uppercase; letter-spacing: 3px;
      color: #6c63ff; font-weight: 700; margin-bottom: 16px;
    }
    .payment-method {
      background: rgba(0, 212, 170, 0.06); border: 1px solid rgba(0, 212, 170, 0.15);
      border-radius: 12px; padding: 20px 24px;
      display: flex; align-items: center; gap: 16px;
    }
    .payment-icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #6c63ff, #00d4aa);
      border-radius: 12px; display: flex; align-items: center;
      justify-content: center; font-size: 20px;
    }
    .payment-info .method { font-size: 14px; font-weight: 600; color: #e8e8f0; }
    .payment-info .detail { font-size: 12px; color: #8888aa; margin-top: 2px; }
    .footer {
      padding: 32px 48px; text-align: center;
      background: linear-gradient(135deg, #0a0a0f 0%, #111118 100%);
    }
    .footer-thanks { font-size: 14px; font-weight: 600; color: #8888aa; margin-bottom: 8px; }
    .footer-tagline { font-size: 11px; color: #555570; letter-spacing: 2px; text-transform: uppercase; }
    .footer-contact { margin-top: 16px; font-size: 12px; color: #555570; }
    .footer-contact a { color: #6c63ff; text-decoration: none; }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; border: none; border-radius: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="header-content">
        <div class="brand">
          <img src="/bluewise-logo.png" alt="BlueWise">
          <div class="brand-text">
            <h1>BlueWise</h1>
            <p>Intelligence d'affaires</p>
          </div>
        </div>
        <div class="invoice-badge">
          <div class="label">Facture</div>
          <div class="number">BW-2026-001</div>
          <div class="date">9 avril 2026</div>
          <div class="status">
            <span class="status-dot"></span>
            En attente
          </div>
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="from">
        <div class="party-label">De</div>
        <div class="party-name">BlueWise AI</div>
        <div class="party-details">
          780 Av. André-Leclerc<br>
          Saint-Côme, QC J0K 2B0<br>
          <br>
          NEQ : 2277941391<br>
          TPS : 706368305RT0001<br>
          TVQ : 4004890898TQ0001<br>
          <br>
          admin@bluewiseai.com<br>
          bluewiseai.com
        </div>
      </div>
      <div class="to">
        <div class="party-label">Facturer à</div>
        <div class="party-name">PÜR Construction & Rénovation Inc.</div>
        <div class="party-details">
          366 Rue du Lac-Légaré<br>
          Saint-Colomban, QC J5K 2K4<br>
          RBQ : 5827-6668-01<br>
          <br>
          purconstructionrenovation@gmail.com<br>
          (514) 926-7669
        </div>
      </div>
    </div>

    <div class="items-section">
      <div class="items-header">
        <span>Description</span>
        <span>Montant</span>
      </div>
      <div class="item">
        <div>
          <div class="item-name">Services numériques & stratégie digitale</div>
          <div class="item-desc">Configuration plateforme, automatisation, présence en ligne & support continu</div>
        </div>
        <div class="item-amount">700,00 $</div>
      </div>
      <div class="item">
        <div>
          <div class="item-name">Budget publicitaire Meta Ads</div>
          <div class="item-desc">Campagnes ciblées — acquisition de leads qualifiés</div>
        </div>
        <div class="item-amount">300,00 $</div>
      </div>
    </div>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row subtotal">
          <span>Sous-total</span>
          <span>1 000,00 $</span>
        </div>
        <div class="total-row">
          <span>TPS (5%)</span>
          <span>50,00 $</span>
        </div>
        <div class="total-row">
          <span>TVQ (9,975%)</span>
          <span>99,75 $</span>
        </div>
        <div class="total-row grand">
          <span class="label">Total</span>
          <span class="value">1 149,75 $</span>
        </div>
      </div>
    </div>

    <div class="payment">
      <div class="payment-title">Modalités de paiement</div>
      <div class="payment-method">
        <div class="payment-icon">⚡</div>
        <div class="payment-info">
          <div class="method">Virement Interac</div>
          <div class="detail">admin@bluewiseai.com — Payable à la réception</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-thanks">Merci pour votre confiance, Jeremy.</div>
      <div class="footer-tagline">Propulsé par BlueWise — Intelligence d'affaires pour les métiers</div>
      <div class="footer-contact">
        <a href="https://bluewiseai.com">bluewiseai.com</a> &nbsp;·&nbsp; admin@bluewiseai.com
      </div>
    </div>
  </div>
</body>
</html>`;
}
