/**
 * Patio door SVG — React component.
 * Direct port of renderPatioDoorSvg from commande-royalty.html.
 */
import { NAVY } from './svgHelpers';

export default function PatioDoorSVG({ config, width = 120, height = 75 }) {
  if (!config?.panels) return null;

  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const panels = config.panels;
  const panelW = innerW / panels.length;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect x={pad - 1} y={pad - 1} width={innerW + 2} height={innerH + 2} fill="none" stroke={NAVY} strokeWidth="1.5" />
      {panels.map((p, i) => {
        const x = pad + i * panelW;
        const cy = pad + innerH / 2;
        const ax1 = x + panelW * 0.22;
        const ax2 = x + panelW * 0.78;
        return (
          <g key={i}>
            <rect x={x + 1} y={pad + 1} width={panelW - 2} height={innerH - 2} fill="none" stroke={NAVY} strokeWidth="0.7" opacity="0.5" />
            {p === 'X' && (
              <>
                <line x1={ax1} y1={cy} x2={ax2} y2={cy} stroke={NAVY} strokeWidth="1" opacity="0.85" />
                <polyline points={`${ax2 - 4},${cy - 3} ${ax2},${cy} ${ax2 - 4},${cy + 3}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.85" />
                <polyline points={`${ax1 + 4},${cy - 3} ${ax1},${cy} ${ax1 + 4},${cy + 3}`} fill="none" stroke={NAVY} strokeWidth="1" opacity="0.85" />
              </>
            )}
          </g>
        );
      })}
      <line x1={pad - 2} y1={pad + innerH + 2} x2={pad + innerW + 2} y2={pad + innerH + 2} stroke={NAVY} strokeWidth="1" />
    </svg>
  );
}
