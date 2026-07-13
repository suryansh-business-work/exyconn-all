import { useId } from 'react';
import { Box } from '@/components/ui';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}

const W = 100;
const H = 32;

/** Lightweight responsive SVG area/line chart — the wavy charts from the design. */
export function Sparkline({ data, color = '#f9851f', height = 56, fill = true }: SparklineProps) {
  const gradientId = useId();
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = W / (data.length - 1);
  const points = data.map((v, i) => [i * step, H - ((v - min) / span) * (H - 4) - 2]);
  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <Box sx={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {fill && <path d={area} fill={`url(#${gradientId})`} />}
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
