/**
 * Entry door SVG — React component.
 * Direct port of renderEntryDoorSvg from commande-royalty.html.
 */
import { ENTRY_DOOR_STYLES } from '@/lib/hub/catalog-data';
import { NAVY } from './svgHelpers';

export default function EntryDoorSVG({ styleKey, width = 100, height = 110 }) {
  const style = ENTRY_DOOR_STYLES[styleKey];
  if (!style?.panels) return null;

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
  const elements = panels.map((p, i) => {
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

      return (
        <g key={i}>
          <rect x={startX} y={pad} width={w} height={innerH} fill="none" stroke={NAVY} strokeWidth="1.2" />
          <rect x={startX + 3} y={pad + 6} width={w - 6} height={innerH - 12} fill="none" stroke={NAVY} strokeWidth="0.6" opacity="0.5" />
          <circle cx={hx} cy={pad + innerH / 2} r="1.2" fill={NAVY} />
        </g>
      );
    }

    if (p === 'side_l' || p === 'side_r') {
      const lines = [1, 2, 3].map((j) => {
        const ly = pad + (innerH * j) / 4;
        return <line key={j} x1={startX + 3} y1={ly} x2={startX + w - 3} y2={ly} stroke={NAVY} strokeWidth="0.3" opacity="0.3" />;
      });
      return (
        <g key={i}>
          <rect x={startX} y={pad} width={w} height={innerH} fill="none" stroke={NAVY} strokeWidth="1.2" />
          <rect x={startX + 2} y={pad + 4} width={w - 4} height={innerH - 8} fill="none" stroke={NAVY} strokeWidth="0.5" opacity="0.4" />
          {lines}
        </g>
      );
    }

    if (p === 'astragal') {
      return <rect key={i} x={startX} y={pad} width={w} height={innerH} fill={NAVY} opacity="0.85" />;
    }

    if (p === 'post') {
      return <rect key={i} x={startX} y={pad} width={w} height={innerH} fill={NAVY} opacity="0.9" />;
    }

    return null;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect x={pad - 1} y={pad - 1} width={innerW + 2} height={innerH + 2} fill="none" stroke={NAVY} strokeWidth="1.5" />
      {elements}
      <polygon
        points={`${pad - 2},${pad + innerH} ${pad + innerW + 2},${pad + innerH} ${pad + innerW - 3},${pad + innerH + 4} ${pad + 3},${pad + innerH + 4}`}
        fill="none"
        stroke={NAVY}
        strokeWidth="1"
      />
    </svg>
  );
}
