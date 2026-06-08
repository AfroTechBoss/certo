// Tiny inline sparkline used by StatCard.
// Renders an SVG with a soft area fill + a coloured line + a dot at the last value.
//
// Props:
//   data   : array of numbers (returns null if fewer than 2 points)
//   color  : line/fill colour (default 'var(--accent)')
//   width  : SVG width  (default 96)
//   height : SVG height (default 32)
//   fill   : whether to render the gradient area under the line (default true)

export const Sparkline = ({ data, color = 'var(--accent)', width = 96, height = 32, fill = true }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = 'spark-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.22"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`}/>
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color}/>
    </svg>
  );
};
