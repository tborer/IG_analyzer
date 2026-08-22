'use client';

const SIZE = 96;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function colorForScore(score: number) {
  if (score >= 75) return '#5C8A5E'; // moss
  if (score >= 50) return '#C89B3C'; // brass
  return '#C7462B'; // signal
}

export default function ScoreDial({
  score,
  label,
  size = SIZE,
}: {
  score: number;
  label?: string;
  size?: number;
}) {
  const radius = (size - STROKE) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = colorForScore(score);

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={STROKE}
          fill="none"
          className="dial-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={STROKE}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 font-mono font-medium"
          style={{ transformOrigin: 'center', fill: '#EDE9E0', fontSize: size * 0.24 }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <span className="eyebrow text-mist">{label}</span>}
    </div>
  );
}
