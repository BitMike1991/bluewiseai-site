/**
 * Server-side SVG generator — string output pixel-identical to the React
 * components in /src/components/hub/commande/svg/*.
 *
 * This lives in /lib so it's reachable from /api/universal/devis/render*
 * (which emit raw HTML) AND from lib/contract-templates/pur.js (which emits
 * the contract HTML stored in the `contracts` table for legal purposes).
 *
 * SOURCE OF TRUTH CONVENTION:
 *   - The React components in /src/components/hub/commande/svg/ are the
 *     originals. Keep this file byte-for-byte aligned with their output
 *     (viewBox, coordinates, stroke widths, opacities).
 *   - If a primitive changes in svgHelpers.js, update the mirror function
 *     below.
 *
 * Hinge/apex convention: triangle APEX is ALWAYS on the hinge side.
 */

const NAVY = '#2A2C35';

// ── Panel primitives (mirrors svgHelpers.js PanelCasement/Angled/Hung/Sliding)

function panelCasement({ type, x, y, w, h }) {
  const pad = 3;
  let parts = '';
  parts += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
  parts += `<rect x="${x + pad}" y="${y + pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${NAVY}" stroke-width="0.6" opacity="0.35"/>`;
  if (type === 'G') {
    parts += `<polyline points="${x + w - pad},${y + pad} ${x + pad},${y + h / 2} ${x + w - pad},${y + h - pad}" fill="none" stroke="${NAVY}" stroke-width="0.9" opacity="0.8"/>`;
  } else if (type === 'D') {
    parts += `<polyline points="${x + pad},${y + pad} ${x + w - pad},${y + h / 2} ${x + pad},${y + h - pad}" fill="none" stroke="${NAVY}" stroke-width="0.9" opacity="0.8"/>`;
  } else if (type === 'A') {
    parts += `<polyline points="${x + pad},${y + h - pad} ${x + w / 2},${y + pad} ${x + w - pad},${y + h - pad}" fill="none" stroke="${NAVY}" stroke-width="0.9" opacity="0.8"/>`;
  }
  return `<g>${parts}</g>`;
}

function panelAngled({ type, x, y, w, h, direction, slant }) {
  const pad = 3;
  let topL, topR, botL, botR;
  if (direction === 'left') {
    topL = [x, y + slant];
    topR = [x + w, y];
    botR = [x + w, y + h];
    botL = [x, y + h - slant];
  } else {
    topL = [x, y];
    topR = [x + w, y + slant];
    botR = [x + w, y + h - slant];
    botL = [x, y + h];
  }
  const innerTL = [topL[0] + pad, topL[1] + pad];
  const innerTR = [topR[0] - pad, topR[1] + pad];
  const innerBR = [botR[0] - pad, botR[1] - pad];
  const innerBL = [botL[0] + pad, botL[1] - pad];
  const cx = (topL[0] + topR[0] + botL[0] + botR[0]) / 4;
  const cy = (topL[1] + topR[1] + botL[1] + botR[1]) / 4;

  let parts = '';
  parts += `<polygon points="${topL[0]},${topL[1]} ${topR[0]},${topR[1]} ${botR[0]},${botR[1]} ${botL[0]},${botL[1]}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
  parts += `<polygon points="${innerTL[0]},${innerTL[1]} ${innerTR[0]},${innerTR[1]} ${innerBR[0]},${innerBR[1]} ${innerBL[0]},${innerBL[1]}" fill="none" stroke="${NAVY}" stroke-width="0.6" opacity="0.35"/>`;
  if (type === 'G') {
    parts += `<polyline points="${innerTR[0]},${innerTR[1]} ${innerBL[0]},${cy} ${innerBR[0]},${innerBR[1]}" fill="none" stroke="${NAVY}" stroke-width="0.9" opacity="0.8"/>`;
  } else if (type === 'D') {
    parts += `<polyline points="${innerTL[0]},${innerTL[1]} ${innerBR[0]},${cy} ${innerBL[0]},${innerBL[1]}" fill="none" stroke="${NAVY}" stroke-width="0.9" opacity="0.8"/>`;
  } else if (type === 'A') {
    parts += `<polyline points="${innerBL[0]},${innerBL[1]} ${cx},${innerTL[1]} ${innerBR[0]},${innerBR[1]}" fill="none" stroke="${NAVY}" stroke-width="0.9" opacity="0.8"/>`;
  }
  return `<g>${parts}</g>`;
}

function panelHung({ mode, x, y, w, h }) {
  const pad = 3;
  const cx = x + w / 2;
  const ay1 = y + h * 0.28;
  const ay2 = y + h * 0.72;
  let parts = '';
  parts += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
  parts += `<line x1="${x + pad}" y1="${y + h / 2}" x2="${x + w - pad}" y2="${y + h / 2}" stroke="${NAVY}" stroke-width="0.6" opacity="0.5"/>`;
  if (mode === 'simple') {
    parts += `<line x1="${cx}" y1="${ay2}" x2="${cx}" y2="${ay1}" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
    parts += `<polyline points="${cx - 3},${ay1 + 4} ${cx},${ay1} ${cx + 3},${ay1 + 4}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
  } else if (mode === 'double') {
    parts += `<line x1="${cx}" y1="${ay1}" x2="${cx}" y2="${ay2}" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
    parts += `<polyline points="${cx - 3},${ay1 + 4} ${cx},${ay1} ${cx + 3},${ay1 + 4}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
    parts += `<polyline points="${cx - 3},${ay2 - 4} ${cx},${ay2} ${cx + 3},${ay2 - 4}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
  }
  return `<g>${parts}</g>`;
}

function panelSliding({ type, x, y, w, h }) {
  const pad = 3;
  let parts = '';
  parts += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
  parts += `<rect x="${x + pad}" y="${y + pad}" width="${w - pad * 2}" height="${h - pad * 2}" fill="none" stroke="${NAVY}" stroke-width="0.6" opacity="0.35"/>`;
  if (type === 'X') {
    const cy = y + h / 2;
    const ax1 = x + w * 0.25;
    const ax2 = x + w * 0.75;
    parts += `<line x1="${ax1}" y1="${cy}" x2="${ax2}" y2="${cy}" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
    parts += `<polyline points="${ax2 - 4},${cy - 3} ${ax2},${cy} ${ax2 - 4},${cy + 3}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
    parts += `<polyline points="${ax1 + 4},${cy - 3} ${ax1},${cy} ${ax1 + 4},${cy + 3}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.8"/>`;
  }
  return `<g>${parts}</g>`;
}

// ── renderWindowConfigSvg (mirrors WindowConfigSVG.js)

export function renderWindowConfigSvg(type, config, width = 100, height = 75) {
  if (!config?.panels || !config?.max) return '';

  const vbW = config.max.w;
  const vbH = config.max.h;
  const pad = Math.max(1, Math.min(vbW, vbH) * 0.04);
  const innerW = vbW - pad * 2;
  const innerH = vbH - pad * 2;
  const panels = config.panels;
  const count = panels.length;

  let content = '';

  if (type === 'guillotine') {
    const panelW = innerW / count;
    panels.forEach((p, i) => {
      const x = pad + i * panelW;
      if (p === 'F') content += panelCasement({ type: 'F', x, y: pad, w: panelW, h: innerH });
      else content += panelHung({ mode: config.mode, x, y: pad, w: panelW, h: innerH });
    });
  } else if (type === 'coulissante') {
    const panelW = innerW / count;
    panels.forEach((p, i) => {
      content += panelSliding({ type: p, x: pad + i * panelW, y: pad, w: panelW, h: innerH });
    });
  } else if (type === 'battant' || type === 'fixe') {
    const ratios = config.widthRatios || panels.map(() => 1);
    const totalR = ratios.reduce((a, b) => a + b, 0);
    let x = pad;
    panels.forEach((p, i) => {
      const panelW = innerW * (ratios[i] / totalR);
      content += panelCasement({ type: p, x, y: pad, w: panelW, h: innerH });
      x += panelW;
    });
  } else if (type === 'baie') {
    const sideSlant = innerH * 0.18;
    const sidePanelW = innerW * 0.25;
    const centerPanelW = innerW - sidePanelW * 2;
    content += panelAngled({ type: panels[0], x: pad, y: pad, w: sidePanelW, h: innerH, direction: 'left', slant: sideSlant });
    content += panelCasement({ type: panels[1], x: pad + sidePanelW, y: pad, w: centerPanelW, h: innerH });
    content += panelAngled({ type: panels[2], x: pad + sidePanelW + centerPanelW, y: pad, w: sidePanelW, h: innerH, direction: 'right', slant: sideSlant });
  } else if (type === 'arc') {
    const arcHeight = innerH * 0.12;
    const panelW = innerW / count;
    panels.forEach((p, i) => {
      const normalizedPos = (i + 0.5) / count - 0.5;
      const yOffset = arcHeight * (1 - Math.cos(normalizedPos * Math.PI * 0.6));
      content += panelCasement({ type: p, x: pad + i * panelW, y: pad + yOffset, w: panelW, h: innerH - yOffset });
    });
  } else if (type === 'auvent') {
    if (config.vertical) {
      const ratios = config.heightRatios || panels.map(() => 1);
      const totalR = ratios.reduce((a, b) => a + b, 0);
      let y = pad;
      panels.forEach((p, i) => {
        const panelH = innerH * (ratios[i] / totalR);
        content += panelCasement({ type: p, x: pad, y, w: innerW, h: panelH });
        y += panelH;
      });
    } else {
      const panelW = innerW / count;
      panels.forEach((p, i) => {
        content += panelCasement({ type: p, x: pad + i * panelW, y: pad, w: panelW, h: innerH });
      });
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" style="max-width:${width}px;max-height:${height}px;width:100%;height:100%;display:block">${content}</svg>`;
}

// ── renderPatioDoorSvg (mirrors PatioDoorSVG.js)

export function renderPatioDoorSvg(config, width = 120, height = 75) {
  if (!config?.panels) return '';
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const panels = config.panels;
  const panelW = innerW / panels.length;

  let content = `<rect x="${pad - 1}" y="${pad - 1}" width="${innerW + 2}" height="${innerH + 2}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>`;
  panels.forEach((p, i) => {
    const x = pad + i * panelW;
    const cy = pad + innerH / 2;
    const ax1 = x + panelW * 0.22;
    const ax2 = x + panelW * 0.78;
    let parts = `<rect x="${x + 1}" y="${pad + 1}" width="${panelW - 2}" height="${innerH - 2}" fill="none" stroke="${NAVY}" stroke-width="0.7" opacity="0.5"/>`;
    if (p === 'X') {
      parts += `<line x1="${ax1}" y1="${cy}" x2="${ax2}" y2="${cy}" stroke="${NAVY}" stroke-width="1" opacity="0.85"/>`;
      parts += `<polyline points="${ax2 - 4},${cy - 3} ${ax2},${cy} ${ax2 - 4},${cy + 3}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.85"/>`;
      parts += `<polyline points="${ax1 + 4},${cy - 3} ${ax1},${cy} ${ax1 + 4},${cy + 3}" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.85"/>`;
    }
    content += `<g>${parts}</g>`;
  });
  content += `<line x1="${pad - 2}" y1="${pad + innerH + 2}" x2="${pad + innerW + 2}" y2="${pad + innerH + 2}" stroke="${NAVY}" stroke-width="1"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
}

// ── renderEntryDoorSvg (mirrors EntryDoorSVG.js)

// Minimal reimport of the entry door styles catalog so this module stays
// pure-server and doesn't reach into client paths. Data shape is the same as
// ENTRY_DOOR_STYLES from lib/hub/catalog-data.js — keep in sync if more styles
// are added.
import { ENTRY_DOOR_STYLES } from '../hub/catalog-data.js';

export function renderEntryDoorSvg(styleKey, width = 100, height = 110) {
  const style = ENTRY_DOOR_STYLES?.[styleKey];
  if (!style?.panels) return '';

  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const panels = style.panels;

  const weights = panels.map((p) => {
    if (p === 'door') return 3;
    if (p === 'side_l' || p === 'side_r') return 1.2;
    if (p === 'astragal') return 0.15;
    if (p === 'post') return 0.25;
    return 1;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const panelWidths = weights.map((w) => (innerW * w) / totalWeight);

  let x = pad;
  let elements = '';
  panels.forEach((p, i) => {
    const w = panelWidths[i];
    const startX = x;
    x += w;

    if (p === 'door') {
      const prev = panels[i - 1];
      const next = panels[i + 1];
      const adjLeft = prev === 'side_l' || prev === 'astragal' || prev === 'post';
      const adjRight = next === 'side_r' || next === 'astragal' || next === 'post';
      let handleOnRight;
      if (adjRight && !adjLeft) handleOnRight = true;
      else if (adjLeft && !adjRight) handleOnRight = false;
      else handleOnRight = true;
      const hx = handleOnRight ? startX + w - 5 : startX + 5;
      elements += `<g>
        <rect x="${startX}" y="${pad}" width="${w}" height="${innerH}" fill="none" stroke="${NAVY}" stroke-width="1.2"/>
        <rect x="${startX + 3}" y="${pad + 6}" width="${w - 6}" height="${innerH - 12}" fill="none" stroke="${NAVY}" stroke-width="0.6" opacity="0.5"/>
        <circle cx="${hx}" cy="${pad + innerH / 2}" r="1.2" fill="${NAVY}"/>
      </g>`;
    } else if (p === 'side_l' || p === 'side_r') {
      let lines = '';
      for (let j = 1; j <= 3; j++) {
        const ly = pad + (innerH * j) / 4;
        lines += `<line x1="${startX + 3}" y1="${ly}" x2="${startX + w - 3}" y2="${ly}" stroke="${NAVY}" stroke-width="0.3" opacity="0.3"/>`;
      }
      elements += `<g>
        <rect x="${startX}" y="${pad}" width="${w}" height="${innerH}" fill="none" stroke="${NAVY}" stroke-width="1.2"/>
        <rect x="${startX + 2}" y="${pad + 4}" width="${w - 4}" height="${innerH - 8}" fill="none" stroke="${NAVY}" stroke-width="0.5" opacity="0.4"/>
        ${lines}
      </g>`;
    } else if (p === 'astragal') {
      elements += `<rect x="${startX}" y="${pad}" width="${w}" height="${innerH}" fill="${NAVY}" opacity="0.85"/>`;
    } else if (p === 'post') {
      elements += `<rect x="${startX}" y="${pad}" width="${w}" height="${innerH}" fill="${NAVY}" opacity="0.9"/>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="${pad - 1}" y="${pad - 1}" width="${innerW + 2}" height="${innerH + 2}" fill="none" stroke="${NAVY}" stroke-width="1.5"/>
    ${elements}
    <polygon points="${pad - 2},${pad + innerH} ${pad + innerW + 2},${pad + innerH} ${pad + innerW - 3},${pad + innerH + 4} ${pad + 3},${pad + innerH + 4}" fill="none" stroke="${NAVY}" stroke-width="1"/>
  </svg>`;
}

/**
 * Resolve an item's rich SVG (if it has enough metadata) or return null.
 * Used by both the devis template and the contract template so renders are
 * always byte-identical across every surface (editor, /q/[token], contract).
 *
 * @param {Object} item - line item
 * @param {number} width - display box width (default 100)
 * @param {number} height - display box height (default 75)
 * @returns {string|null} SVG string, or null if metadata is insufficient
 */
export function richItemSvg(item, width, height) {
  if (!item) return null;
  const cat = item._category;
  if (cat === 'window' && item._window_type && item._config?.panels) {
    return renderWindowConfigSvg(item._window_type, item._config, width || 100, height || 75);
  }
  if (cat === 'entry_door' && item._entry_door_style) {
    return renderEntryDoorSvg(item._entry_door_style, width || 100, height || 110);
  }
  if (cat === 'patio_door' && item._config?.panels) {
    return renderPatioDoorSvg(item._config, width || 120, height || 75);
  }
  return null;
}
