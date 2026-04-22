/**
 * Devis Parser — regex-based extraction, NO GPT needed.
 * Both Royalty soumissions and PÜR bons de commande have structured formats.
 */

/**
 * Strip unwanted marketing fluff from fenestration specs.
 *
 * Rules (Mikael, repeated 3+ times across sessions — see memory feedback_thermos_wording):
 *   - NEVER "coupe-froid" or "coupe froid" anywhere
 *   - NEVER bare "Triple" (extracted separately via thermos type)
 *   - Keep thickness + thermos type + gas: "Thermos 7/8" double Low-E Argon"
 *     or "Thermos 1 1/4" triple Low-E Argon"
 */
function stripTriple(str) {
  if (!str || typeof str !== 'string') return str;
  let result = str;
  // Strip ALL occurrences of "coupe-froid" / "coupe froid" (not just paired with Triple)
  result = result.replace(/\bcoupe[-\s]?froid\b/gi, '');
  // Remove bare "Triple" word
  result = result.replace(/\bTriple\b/gi, '');
  // Clean up double commas / leading-trailing commas / extra whitespace / stray spaces before commas
  result = result
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/\s{2,}/g, ' ');
  return result.trim();
}

export function detectType(text) {
  if (/soumission/i.test(text) && /no\.\s*:/i.test(text)) return 'soumission';
  return 'bon_commande';
}

/**
 * Parse a Royalty soumission PDF text.
 * Format: Item #N  Modèle : XX  Dim. : Largeur XX X XX Hauteur  PRICE  TOTAL
 */
function parseSoumission(text) {
  const numMatch = text.match(/Soumission\s+No\.\s*:\s*([\d\s]+)/i);
  const soumissionNumber = numMatch ? numMatch[1].replace(/\s/g, '') : null;
  const dateMatch = text.match(/Date de commande\s*\n\s*(\d{2}\/\d{2}\/\d{4})/);
  const date = dateMatch ? dateMatch[1] : null;

  const items = [];
  const lines = text.split('\n');

  // Royalty PDF layout (verified against 2025-08 samples, Mikael 2026-04-22):
  //
  //   [specs block: QTÉ / TYPE / Volet-Cadre / Thermos / Intérieure / Réf NRCan]
  //   UUU.UUTTT.TTItem #N         ← prices concatenated before "Item #N" (pdf-parse v1)
  //                                  OR separate lines: "UUU.UU\nTTT.TT\nItem #N"
  //   Modèle : XX   Dim. : Largeur W X H  Hauteur
  //   [next item's specs block...]
  //
  // Historical parser assumed prices and specs BOTH came BEFORE Item #N as
  // standalone lines, AND that QTÉ/TYPE came AFTER Item #N. That was wrong on
  // both counts — it missed items 1-3 (regex rejected price-prefixed Item
  // lines) and misread qty/type for later items (scanning forward found the
  // NEXT item's specs). Fixed:
  //   1. Item marker regex matches anywhere on the line; extract price prefix
  //      inline when present.
  //   2. Specs for Item #N are scanned BACKWARDS from Item #N to the previous
  //      Item #N (or document start), so we read this item's real qty/type.

  const PRICE_NUM = /([\d][\d\s]*\.\d{2})/g;
  const ITEM_MARK = /Item\s*#\s*(\d+)/i;

  // Pass 1: locate every Item #N marker (any position on the line)
  // + extract inline prices + dim line + record the specs block start (prev
  // marker's dim line + 1, or 0 for item #1).
  const markers = [];
  let prevDimLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const itemMatch = line.match(ITEM_MARK);
    if (!itemMatch) continue;
    const itemNumber = parseInt(itemMatch[1]);
    if (!Number.isFinite(itemNumber)) continue;

    // Prices inline prefix (e.g. "909.00909.00Item #1" or "2 530.002 530.00Item #2")
    const prefix = line.slice(0, itemMatch.index);
    const inlinePrices = [];
    for (const m of prefix.matchAll(PRICE_NUM)) {
      inlinePrices.push(parseFloat(m[1].replace(/\s/g, '')));
    }

    // Fallback: scan up to 4 lines before for standalone price lines (items
    // #4+ in the reference PDF have prices split: "909.00909.00" on its own
    // line, then "Item #4" on the next).
    const priceCandidates = [...inlinePrices];
    if (priceCandidates.length === 0) {
      for (let p = Math.max(0, i - 4); p < i; p++) {
        const pLine = lines[p].trim();
        const concat = pLine.match(/^([\d\s]+\.\d{2})([\d\s]+\.\d{2})$/);
        if (concat) {
          priceCandidates.push(parseFloat(concat[1].replace(/\s/g, '')));
          priceCandidates.push(parseFloat(concat[2].replace(/\s/g, '')));
          continue;
        }
        const single = pLine.match(/^([\d\s]+\.\d{2})$/);
        if (single) priceCandidates.push(parseFloat(single[1].replace(/\s/g, '')));
      }
    }

    let unitPrice = null;
    let totalPrice = null;
    if (priceCandidates.length >= 2) {
      unitPrice = Math.min(...priceCandidates);
      totalPrice = Math.max(...priceCandidates);
    } else if (priceCandidates.length === 1) {
      unitPrice = priceCandidates[0];
      totalPrice = priceCandidates[0];
    }

    // Dim line — next non-empty line after the marker
    let dimLineIdx = -1;
    let model = null, width = null, height = null;
    for (let d = i + 1; d < Math.min(i + 4, lines.length); d++) {
      const dimLine = lines[d].trim();
      if (!dimLine) continue;
      // Model captures "Porte simple" (two words) or single codes like G1, BSF.
      const dimMatch = dimLine.match(/Mod[èe]le\s*:\s*([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s-]*?)\s+Dim\.\s*:\s*Largeur\s+([\d\s\/]+)\s*X\s*([\d\s\/]+)\s*Hauteur/i);
      if (dimMatch) {
        model = dimMatch[1].trim();
        width = dimMatch[2].trim();
        height = dimMatch[3].trim();
        dimLineIdx = d;
        break;
      }
    }
    if (dimLineIdx === -1) continue; // Not a real item marker

    markers.push({
      itemNumber,
      markerLine: i,
      dimLine: dimLineIdx,
      specsStart: prevDimLineIdx + 1, // first line of THIS item's specs block
      specsEnd: i,                    // exclusive — ends at Item #N line
      unitPrice,
      totalPrice,
      model,
      width,
      height,
    });
    prevDimLineIdx = dimLineIdx;
  }

  // Pass 2: for each marker, scan its specs block (BACKWARDS, not forwards)
  // to pull qty + type + ouvrant. The specs block belongs to THIS item, not
  // the next one — that was the qty=2/qty=1 flip bug.
  for (const m of markers) {
    let qty = 1;
    let type = null;
    let ouvrant = null;

    for (let j = m.specsStart; j < m.specsEnd; j++) {
      const l = (lines[j] || '').trim();
      if (!l) continue;

      // Quantity — accept "QTÉ. : 1" on one line or split across two lines
      const qm = l.match(/^QT[ÉE]\.\s*:?\s*(\d+)\s*$/i);
      if (qm) {
        qty = parseInt(qm[1]);
        continue;
      }
      if (/^QT[ÉE]\.\s*:?\s*$/i.test(l) && j + 1 < m.specsEnd) {
        const nextNum = (lines[j + 1] || '').trim().match(/^(\d+)$/);
        if (nextNum) { qty = parseInt(nextNum[1]); continue; }
      }

      // TYPE — "TYPE :Guillotine Modèle G1 Ouvrant :X" (all on one line after
      // pdf-parse concat) OR "TYPE :" on one line, content on next.
      //   - Guillotine / Battant / Coulissante / Fixe / Auvent / etc.
      //   - Also match "Style :Porte simple ..." for doors.
      const typeCompact = l.match(/^TYPE\s*:\s*(\S+)(?:\s+Mod[èe]le\s+\S+)?(?:\s+Ouvrant\s*:\s*(\S+))?/i);
      if (typeCompact) {
        type = typeCompact[1];
        if (typeCompact[2]) ouvrant = typeCompact[2];
        continue;
      }
      if (/^TYPE\s*:\s*$/i.test(l) && j + 1 < m.specsEnd) {
        const next = (lines[j + 1] || '').trim();
        const tm = next.match(/^(\S+)(?:\s+Mod[èe]le\s+\S+)?(?:\s+Ouvrant\s*:\s*(\S+))?/i);
        if (tm) { type = tm[1]; if (tm[2]) ouvrant = tm[2]; }
      }
      const styleMatch = l.match(/^Style\s*:\s*(\S+(?:\s+\S+)?)/i);
      if (styleMatch && !type) type = styleMatch[1];
    }

    if (m.model && m.width && m.height) {
      items.push({
        itemNumber: m.itemNumber,
        model: m.model,
        dimensions: { width: m.width, height: m.height },
        qty,
        type: stripTriple(type),
        ouvrant,
        unitPrice: m.unitPrice,
        totalPrice: m.totalPrice,
      });
    }
  }

  // Extract escompte % from bottom of soumission
  // Pattern: "Moins escompte :" near "40 %" or "$XX,XXX.XX40 %"
  let escomptePct = 0;
  const escompteMatch = text.match(/(\d+)\s*%/g);
  // Look for percentage near "escompte" or "Moins"
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/moins\s*escompte/i.test(l) || /escompte/i.test(l)) {
      // Check this line and nearby lines for a percentage
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 2); j++) {
        const pctMatch = lines[j].match(/(\d{2,3})\s*%/);
        if (pctMatch) {
          const pct = parseInt(pctMatch[1]);
          if (pct >= 10 && pct <= 60) { escomptePct = pct; break; }
        }
      }
      if (escomptePct > 0) break;
    }
  }

  return { soumissionNumber, date, fournisseur: 'Royalty', items, escomptePct };
}

/**
 * Parse a PÜR bon de commande PDF text.
 * Format: project ID, document number, items with dimensions + model
 */
function parseBonCommande(text, filename) {
  // Extract project ID (s1-xxx-N pattern)
  const projMatch = text.match(/\b(s\d+-[\w-]+)\b/i);
  const projectId = projMatch ? projMatch[1] : filename.replace(/\.pdf$/i, '').replace(/[^a-z0-9-]/gi, '_').slice(0, 30);

  // Extract document number
  const docMatch = text.match(/PUR[-\s]CMD[-\s](\d{4}[-\s]\d+)/i);
  const documentNumber = docMatch ? 'PUR-CMD-' + docMatch[1].replace(/\s/g, '-') : null;

  // Extract client final
  const clientMatch = text.match(/Client\s+final\s*:\s*(.+)/i);
  let clientName = null;
  if (clientMatch) {
    const raw = clientMatch[1].trim();
    if (raw && raw !== '—' && raw !== '-' && raw.toLowerCase() !== 'null') {
      clientName = raw;
    }
  }

  const items = [];

  // Items are blocks like:
  // Fenêtre coulissante\n01\n× 4\n68" × 37 3/4"\nC2G · XO
  // OR: Porte simple\n01\n31 1/2" × 82 1/2"\nPS-30
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect item type line (Fenêtre coulissante, Porte simple, etc.)
    if (!/^(Fen[êe]tre|Porte|Battant)/i.test(line)) continue;

    const type = line;
    let index = null;
    let qty = 1;
    let dimStr = null;
    let model = null;
    let ouvrant = null;
    let specs = [];

    // Scan next lines for item details
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
      const l = lines[j];

      // Item number (01, 02, etc.)
      if (/^\d{1,2}$/.test(l) && !index) {
        index = parseInt(l);
        continue;
      }

      // Quantity: × 4 or ×4
      if (/^[×x]\s*(\d+)$/i.test(l)) {
        const qm = l.match(/[×x]\s*(\d+)/i);
        qty = qm ? parseInt(qm[1]) : 1;
        continue;
      }

      // Dimensions: 68" × 37 3/4" or 31 1/2" × 82\n1/2" (multiline)
      if (/^\d[\d\s\/]+"?\s*[×x]\s*\d/i.test(l)) {
        dimStr = l.replace(/[""]/g, '');
        // Check if height continues on next line (e.g., "46 3/4" × 37\n3/4"")
        if (j + 1 < lines.length && /^[\d\/]+"?$/.test(lines[j + 1])) {
          dimStr += ' ' + lines[j + 1].replace(/[""]/g, '');
          j++;
        }
        continue;
      }

      // Model: C2G · XO, C3, BS1, PS-30, G1
      if (/^[A-Z][A-Z0-9-]+(\s*[·.]\s*\w+)?$/i.test(l) && !model) {
        const parts = l.split(/[·.]/);
        model = parts[0].trim();
        if (parts[1]) ouvrant = parts[1].trim();
        continue;
      }

      // Specs lines (Collection, Couleur, etc.)
      if (/^(Collection|Couleur|Profilé|Thermos|Config|Style|Modèle|Slab|Cadre|Sens|Seuil|Serrure|Penture|Poignée|Moustiquaire|Rencontre|Épaisseur)/i.test(l)) {
        specs.push(l);
        continue;
      }

      // Stop at next item or section
      if (/^(Fen[êe]tre|Porte|Battant|ARTICLES|PÜR\s+Construction)/i.test(l)) break;
    }

    if (!dimStr) continue;

    // Parse dimensions
    const dimParts = dimStr.split(/[×x]/i);
    const width = dimParts[0] ? dimParts[0].trim() : null;
    const height = dimParts[1] ? dimParts[1].trim() : null;

    items.push({
      index: index || items.length + 1,
      type: stripTriple(type),
      model: model || 'N/A',
      dimensions: { width, height },
      qty,
      ouvrant,
      specs: stripTriple(specs.join(', ')),
    });
  }

  return { projectId, documentNumber, clientName, clientAddress: null, filename, items };
}

/**
 * Parse all documents. No GPT — pure regex.
 */
export async function parseDocuments(files) {
  const orders = [];
  let soumission = null;

  for (const file of files) {
    const type = file.type || detectType(file.text);
    try {
      if (type === 'soumission') {
        soumission = parseSoumission(file.text);
        soumission._source = file.filename;
      } else {
        const order = parseBonCommande(file.text, file.filename);
        orders.push(order);
      }
    } catch (err) {
      console.error(`[devis/parser] Error for ${file.filename}:`, err.message);
      if (type === 'soumission') {
        soumission = { _source: file.filename, _error: err.message, items: [] };
      } else {
        orders.push({ _source: file.filename, _error: err.message, items: [], projectId: file.filename });
      }
    }
  }

  return { orders, soumission };
}
