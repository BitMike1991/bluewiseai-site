/**
 * Devis Parser — regex-based extraction, NO GPT needed.
 * Both Royalty soumissions and PÜR bons de commande have structured formats.
 */

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

  // Process line-by-line: prices appear 2 lines BEFORE "Item #N"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match "Item #N" (number on same line or NEXT line if pdf-parse split it)
    let itemNumber = null;
    const fullMatch = line.match(/^Item\s*#\s*(\d+)$/i);
    if (fullMatch) {
      itemNumber = parseInt(fullMatch[1]);
    } else if (/^Item\s*#\s*$/i.test(line) && i + 1 < lines.length && /^\d+$/.test(lines[i + 1].trim())) {
      itemNumber = parseInt(lines[i + 1].trim());
      i++; // skip the number line
    }
    if (itemNumber === null) continue;

    // Prices: 1-4 lines before "Item #N"
    // pdf-parse v1 may concat prices: "964.00964.00" or "5 356.001 339.00"
    // pdf-parse v2/pymupdf may split: "964.00\n964.00"
    let unitPrice = null;
    let totalPrice = null;
    const priceCandidates = [];
    for (let p = Math.max(0, i - 4); p < i; p++) {
      const pLine = lines[p].trim();
      // Try concatenated format: "964.00964.00" or "5 356.001 339.00"
      const concatMatch = pLine.match(/^([\d\s]+\.\d{2})([\d\s]+\.\d{2})$/);
      if (concatMatch) {
        priceCandidates.push(parseFloat(concatMatch[1].replace(/\s/g, '')));
        priceCandidates.push(parseFloat(concatMatch[2].replace(/\s/g, '')));
        continue;
      }
      // Try single price line: "964.00" or "5 356.00"
      const singleMatch = pLine.match(/^([\d\s]+\.\d{2})$/);
      if (singleMatch) {
        priceCandidates.push(parseFloat(singleMatch[1].replace(/\s/g, '')));
      }
    }
    if (priceCandidates.length >= 2) {
      unitPrice = Math.min(...priceCandidates);
      totalPrice = Math.max(...priceCandidates);
    } else if (priceCandidates.length === 1) {
      unitPrice = priceCandidates[0];
      totalPrice = priceCandidates[0];
    }

    // Dimensions: scan next few lines for "Modèle : XX  Dim. : Largeur XX X XX Hauteur"
    let model = null;
    let width = null;
    let height = null;
    for (let d = i + 1; d < Math.min(i + 4, lines.length); d++) {
      const dimLine = lines[d].trim();
      const dimMatch = dimLine.match(/Mod[èe]le\s*:\s*(\w+)\s+Dim\.\s*:\s*Largeur\s+([\d\s\/]+)\s*X\s*([\d\s\/]+)\s*Hauteur/i);
      if (dimMatch) {
        model = dimMatch[1].trim();
        width = dimMatch[2].trim();
        height = dimMatch[3].trim();
        break;
      }
    }

    // Qty + type + ouvrant: scan next ~10 lines
    let qty = 1;
    let type = null;
    let ouvrant = null;
    for (let j = i + 2; j < Math.min(i + 12, lines.length); j++) {
      const l = lines[j].trim();
      const qm = l.match(/^QT[ÉE]\.\s*:?\s*(\d+)/i);
      if (qm) qty = parseInt(qm[1]);
      // pdf-parse v1 may split: "QTÉ. :" on one line, number on next
      if (/^QT[ÉE]\.\s*:?\s*$/i.test(l) && j + 1 < lines.length) {
        const nextNum = lines[j + 1].trim().match(/^(\d+)$/);
        if (nextNum) qty = parseInt(nextNum[1]);
      }
      // pdf-parse v1 may split TYPE: "TYPE :" then "Coulissant Modèle C3 Ouvrant :GFD"
      const tm = l.match(/^(?:TYPE\s*:\s*)?(\w+)\s+Mod[èe]le\s+(\w+)\s+Ouvrant\s*:?\s*(\w*)/i);
      if (tm) {
        type = tm[1];
        ouvrant = tm[3] || null;
      }
      if (/^Item\s*#/i.test(l)) break;
    }

    if (model && width && height) {
      items.push({ itemNumber, model, dimensions: { width, height }, qty, type, ouvrant, unitPrice, totalPrice });
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
      type,
      model: model || 'N/A',
      dimensions: { width, height },
      qty,
      ouvrant,
      specs: specs.join(', '),
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
