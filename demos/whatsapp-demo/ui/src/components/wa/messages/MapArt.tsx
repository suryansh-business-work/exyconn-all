import { Box } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';

/** A static map illustration with a pin in the middle — no map tiles are fetched. */
export function MapArt({ height, label }: Readonly<{ height: string; label: string }>) {
  const c = useWaPalette();
  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      viewBox="0 0 300 150"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: '100%', height, display: 'block' }}
    >
      <rect width="300" height="150" fill={c.mapLand} />
      <path d="M0 118c40-10 70 8 110-2s60-30 100-24 70 20 90 14v44H0z" fill={c.mapWater} />
      <g stroke={c.mapRoad} strokeLinecap="round" fill="none">
        <path d="M-10 40h320M-10 92c60-6 120 4 180-6s100-4 140 2" strokeWidth="9" />
        <path d="M70-10v170M196-10l-24 170M250-10v120" strokeWidth="7" />
        <path d="M0 66h300M120-10v170M30 0l40 150" strokeWidth="3" />
      </g>
      <g transform="translate(150 62)">
        <ellipse cx="0" cy="22" rx="9" ry="3" fill={c.overlay} opacity="0.35" />
        <path d="M0 22C-6 12-14 4-14-6a14 14 0 0 1 28 0c0 10-8 18-14 28z" fill={c.pin} />
        <circle cx="0" cy="-6" r="5" fill={c.qrPaper} />
      </g>
    </Box>
  );
}
