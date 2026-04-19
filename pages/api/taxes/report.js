// pages/api/taxes/report.js
// TPS/TVQ reconciliation for a given date range. Used by /platform/taxes to
// produce the quarterly "TPS à remettre" figure Jérémy hands to his
// accountant (or files himself via Revenu Québec NETFILE).
//
// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&format=json|csv
//   Defaults: current calendar quarter.
//   - format=csv returns a downloadable CSV (Excel-friendly, with header).
//
// Returns: {
//   period: { from, to, label }
//   revenue: {
//     total_ttc, subtotal_ht, tps_collected, tvq_collected, payment_count
//   }
//   expenses: {
//     total_ttc, subtotal_ht, tps_paid, tvq_paid, expense_count
//   }
//   net: {
//     tps_remittance,  // = tps_collected - tps_paid
//     tvq_remittance,  // = tvq_collected - tvq_paid
//     total_remittance
//   }
//   by_category: [{ category, total, tps, tvq, count }]
// }

import { getAuthContext } from '../../../lib/supabaseServer';

function currentQuarterBounds() {
  const now = new Date();
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const from = new Date(now.getFullYear(), qStartMonth, 1);
  const to   = new Date(now.getFullYear(), qStartMonth + 3, 1);
  to.setDate(to.getDate() - 1);
  return { from, to };
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function quarterLabel(from) {
  const m = from.getMonth();
  const q = Math.floor(m / 3) + 1;
  return `T${q} ${from.getFullYear()}`;
}

function toNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function reverseCalcIfMissing(amount, storedTps, storedTvq) {
  // Use stored tps/tvq when present (audit-accurate). Reverse-calc only when
  // legacy rows have no tps/tvq split yet (pre-F-P4 data).
  if (storedTps != null && storedTvq != null) {
    return { tps: toNumber(storedTps), tvq: toNumber(storedTvq), subtotal: toNumber(amount) - toNumber(storedTps) - toNumber(storedTvq) };
  }
  // Rounding policy: round TPS + TVQ independently, then derive subtotal as
  // (TTC − TPS − TVQ) so the three components always reconstitute the TTC
  // exactly. Prior version rounded subtotal separately, which drifted by up
  // to $0.03 per transaction and accumulated across a quarter's report.
  const amt = toNumber(amount);
  const ht  = amt / 1.14975;
  const tps = Math.round(ht * 0.05 * 100) / 100;
  const tvq = Math.round(ht * 0.09975 * 100) / 100;
  const subtotal = Math.round((amt - tps - tvq) * 100) / 100;
  return { tps, tvq, subtotal };
}

function buildCsv(rows) {
  const header = ['Type', 'Date', 'Description', 'Total TTC', 'Sous-total HT', 'TPS', 'TVQ'];
  const csv = [header.join(',')];
  for (const r of rows) {
    const line = [
      r.type,
      r.date,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.total.toFixed(2),
      r.subtotal.toFixed(2),
      r.tps.toFixed(2),
      r.tvq.toFixed(2),
    ].join(',');
    csv.push(line);
  }
  return csv.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabase, customerId, user } = await getAuthContext(req, res);
  if (!user)       return res.status(401).json({ error: 'Not authenticated' });
  if (!customerId) return res.status(403).json({ error: 'No customer mapping' });

  // Resolve date range
  const def = currentQuarterBounds();
  const fromStr = typeof req.query.from === 'string' ? req.query.from : isoDate(def.from);
  const toStr   = typeof req.query.to   === 'string' ? req.query.to   : isoDate(def.to);
  const from = new Date(fromStr + 'T00:00:00Z');
  const to   = new Date(toStr   + 'T23:59:59Z');
  if (!(from instanceof Date) || isNaN(from) || !(to instanceof Date) || isNaN(to) || from > to) {
    return res.status(400).json({ error: 'Invalid from/to dates' });
  }

  // Pull payments + expenses in range
  const [{ data: payments, error: pErr }, { data: expenses, error: eErr }] = await Promise.all([
    supabase.from('payments')
      .select('id, amount, subtotal, tps, tvq, payment_type, payment_method, paid_at, created_at, job_id')
      .eq('customer_id', customerId)
      .eq('status', 'succeeded')
      .gte('paid_at', from.toISOString())
      .lte('paid_at', to.toISOString()),
    supabase.from('expenses')
      .select('id, total, subtotal, tps, tvq, vendor, category, description, paid_at, invoice_number')
      .eq('customer_id', customerId)
      .gte('paid_at', from.toISOString())
      .lte('paid_at', to.toISOString()),
  ]);
  if (pErr) return res.status(500).json({ error: pErr.message });
  if (eErr) return res.status(500).json({ error: eErr.message });

  // Aggregate revenue
  let revTotal = 0, revSub = 0, revTps = 0, revTvq = 0;
  for (const p of payments || []) {
    const amt = toNumber(p.amount);
    const split = reverseCalcIfMissing(amt, p.tps, p.tvq);
    revTotal += amt;
    revSub   += split.subtotal;
    revTps   += split.tps;
    revTvq   += split.tvq;
  }

  // Aggregate expenses + per-category breakdown
  let expTotal = 0, expSub = 0, expTps = 0, expTvq = 0;
  const byCategory = {};
  for (const e of expenses || []) {
    const amt = toNumber(e.total);
    const split = reverseCalcIfMissing(amt, e.tps, e.tvq);
    expTotal += amt;
    expSub   += split.subtotal;
    expTps   += split.tps;
    expTvq   += split.tvq;
    const cat = e.category || 'autre';
    if (!byCategory[cat]) byCategory[cat] = { category: cat, total: 0, subtotal: 0, tps: 0, tvq: 0, count: 0 };
    byCategory[cat].total    += amt;
    byCategory[cat].subtotal += split.subtotal;
    byCategory[cat].tps      += split.tps;
    byCategory[cat].tvq      += split.tvq;
    byCategory[cat].count    += 1;
  }

  const report = {
    period: { from: isoDate(from), to: isoDate(to), label: quarterLabel(from) },
    revenue: {
      total_ttc:     Math.round(revTotal * 100) / 100,
      subtotal_ht:   Math.round(revSub * 100) / 100,
      tps_collected: Math.round(revTps * 100) / 100,
      tvq_collected: Math.round(revTvq * 100) / 100,
      payment_count: (payments || []).length,
    },
    expenses: {
      total_ttc:   Math.round(expTotal * 100) / 100,
      subtotal_ht: Math.round(expSub * 100) / 100,
      tps_paid:    Math.round(expTps * 100) / 100,
      tvq_paid:    Math.round(expTvq * 100) / 100,
      expense_count: (expenses || []).length,
    },
    net: {
      tps_remittance:   Math.round((revTps - expTps) * 100) / 100,
      tvq_remittance:   Math.round((revTvq - expTvq) * 100) / 100,
      total_remittance: Math.round(((revTps + revTvq) - (expTps + expTvq)) * 100) / 100,
    },
    by_category: Object.values(byCategory).sort((a, b) => b.total - a.total).map(c => ({
      ...c,
      total:    Math.round(c.total * 100) / 100,
      subtotal: Math.round(c.subtotal * 100) / 100,
      tps:      Math.round(c.tps * 100) / 100,
      tvq:      Math.round(c.tvq * 100) / 100,
    })),
  };

  if (req.query.format === 'csv') {
    const rows = [];
    for (const p of payments || []) {
      const split = reverseCalcIfMissing(p.amount, p.tps, p.tvq);
      rows.push({
        type: 'REVENU',
        date: (p.paid_at || p.created_at || '').slice(0, 10),
        description: `${p.payment_type || 'Paiement'} (${p.payment_method || 'inconnu'})`,
        total: toNumber(p.amount),
        subtotal: split.subtotal,
        tps: split.tps,
        tvq: split.tvq,
      });
    }
    for (const e of expenses || []) {
      const split = reverseCalcIfMissing(e.total, e.tps, e.tvq);
      rows.push({
        type: 'DEPENSE',
        date: (e.paid_at || '').slice(0, 10),
        description: `${e.vendor || ''} — ${e.description || e.category || ''}`.trim(),
        total: toNumber(e.total),
        subtotal: split.subtotal,
        tps: split.tps,
        tvq: split.tvq,
      });
    }
    rows.sort((a, b) => (a.date > b.date ? 1 : -1));
    const csv = buildCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-tps-tvq-${report.period.from}_${report.period.to}.csv"`);
    return res.status(200).send(csv);
  }

  return res.status(200).json(report);
}
