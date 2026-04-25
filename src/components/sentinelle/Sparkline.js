// Tiny inline-SVG sparkline for Sentinelle latency. No chart lib.
// Props:
//   points: number[]  — most recent latency samples (ms), oldest first
//   width / height: SVG canvas
//   color: stroke color (defaults to currentColor)

export default function Sparkline({ points = [], width = 96, height = 24, color }) {
  if (!points || points.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2}
              stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(max - min, 1);
  const stepX = width / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / span) * (height - 2) - 1;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={path} fill="none" stroke={color || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
