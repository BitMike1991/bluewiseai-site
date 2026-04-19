/**
 * SVG panel primitives — direct port from commande-royalty.html.
 * Returns JSX SVG elements.
 *
 * CONVENTION: Triangle apex (point) is ALWAYS on the hinge side.
 */

const NAVY = '#2A2C35';

export function PanelCasement({ type, x, y, w, h }) {
  const pad = 3;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={NAVY} strokeWidth="1.5" />
      <rect x={x + pad} y={y + pad} width={w - pad * 2} height={h - pad * 2} fill="none" stroke={NAVY} strokeWidth="0.6" opacity="0.35" />
      {type === 'G' && (
        <polyline points={`${x + w - pad},${y + pad} ${x + pad},${y + h / 2} ${x + w - pad},${y + h - pad}`} fill="none" stroke={NAVY} strokeWidth="0.9" opacity="0.8" />
      )}
      {type === 'D' && (
        <polyline points={`${x + pad},${y + pad} ${x + w - pad},${y + h / 2} ${x + pad},${y + h - pad}`} fill="none" stroke={NAVY} strokeWidth="0.9" opacity="0.8" />
      )}
      {type === 'A' && (
        <polyline points={`${x + pad},${y + h - pad} ${x + w / 2},${y + pad} ${x + w - pad},${y + h - pad}`} fill="none" stroke={NAVY} strokeWidth="0.9" opacity="0.8" />
      )}
    </g>
  );
}

export function PanelAngled({ type, x, y, w, h, direction, slant }) {
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

  return (
    <g>
      <polygon points={`${topL[0]},${topL[1]} ${topR[0]},${topR[1]} ${botR[0]},${botR[1]} ${botL[0]},${botL[1]}`} fill="none" stroke={NAVY} strokeWidth="1.5" />
      <polygon points={`${innerTL[0]},${innerTL[1]} ${innerTR[0]},${innerTR[1]} ${innerBR[0]},${innerBR[1]} ${innerBL[0]},${innerBL[1]}`} fill="none" stroke={NAVY} strokeWidth="0.6" opacity="0.35" />
      {type === 'G' && (
        <polyline points={`${innerTR[0]},${innerTR[1]} ${innerBL[0]},${cy} ${innerBR[0]},${innerBR[1]}`} fill="none" stroke={NAVY} strokeWidth="0.9" opacity="0.8" />
      )}
      {type === 'D' && (
        <polyline points={`${innerTL[0]},${innerTL[1]} ${innerBR[0]},${cy} ${innerBL[0]},${innerBL[1]}`} fill="none" stroke={NAVY} strokeWidth="0.9" opacity="0.8" />
      )}
      {type === 'A' && (
        <polyline points={`${innerBL[0]},${innerBL[1]} ${cx},${innerTL[1]} ${innerBR[0]},${innerBR[1]}`} fill="none" stroke={NAVY} strokeWidth="0.9" opacity="0.8" />
      )}
    </g>
  );
}

export function PanelHung({ mode, x, y, w, h }) {
  const pad = 3;
  const cx = x + w / 2;
  const ay1 = y + h * 0.28;
  const ay2 = y + h * 0.72;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={NAVY} strokeWidth="1.5" />
      <line x1={x + pad} y1={y + h / 2} x2={x + w - pad} y2={y + h / 2} stroke={NAVY} strokeWidth="0.6" opacity="0.5" />
      {mode === 'simple' && (
        <>
          <line x1={cx} y1={ay2} x2={cx} y2={ay1} stroke={NAVY} strokeWidth="1" opacity="0.8" />
          <polyline points={`${cx - 3},${ay1 + 4} ${cx},${ay1} ${cx + 3},${ay1 + 4}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.8" />
        </>
      )}
      {mode === 'double' && (
        <>
          <line x1={cx} y1={ay1} x2={cx} y2={ay2} stroke={NAVY} strokeWidth="1" opacity="0.8" />
          <polyline points={`${cx - 3},${ay1 + 4} ${cx},${ay1} ${cx + 3},${ay1 + 4}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.8" />
          <polyline points={`${cx - 3},${ay2 - 4} ${cx},${ay2} ${cx + 3},${ay2 - 4}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.8" />
        </>
      )}
    </g>
  );
}

export function PanelSliding({ type, x, y, w, h }) {
  const pad = 3;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={NAVY} strokeWidth="1.5" />
      <rect x={x + pad} y={y + pad} width={w - pad * 2} height={h - pad * 2} fill="none" stroke={NAVY} strokeWidth="0.6" opacity="0.35" />
      {type === 'X' && (() => {
        const cy = y + h / 2;
        const ax1 = x + w * 0.25;
        const ax2 = x + w * 0.75;
        return (
          <>
            <line x1={ax1} y1={cy} x2={ax2} y2={cy} stroke={NAVY} strokeWidth="1" opacity="0.8" />
            <polyline points={`${ax2 - 4},${cy - 3} ${ax2},${cy} ${ax2 - 4},${cy + 3}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.8" />
            <polyline points={`${ax1 + 4},${cy - 3} ${ax1},${cy} ${ax1 + 4},${cy + 3}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.8" />
          </>
        );
      })()}
    </g>
  );
}

export { NAVY };
