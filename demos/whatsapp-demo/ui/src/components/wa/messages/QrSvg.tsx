import { useMemo } from 'react';
import QRCode from 'qrcode';
import { Box } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';

interface QrSvgProps {
  data: string;
  size: string;
  label: string;
}

/** A real, scannable QR code for `data`, drawn as one SVG path. */
export function QrSvg({ data, size, label }: Readonly<QrSvgProps>) {
  const c = useWaPalette();
  const { path, count } = useMemo(() => {
    const qr = QRCode.create(data, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    const cells: string[] = [];
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (qr.modules.get(x, y)) {
          cells.push(`M${x + 2} ${y + 2}h1v1h-1z`);
        }
      }
    }
    return { path: cells.join(''), count: n + 4 };
  }, [data]);
  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      sx={{ width: size, height: size, display: 'block' }}
    >
      <rect width={count} height={count} fill={c.qrPaper} />
      <path d={path} fill={c.qrInk} />
    </Box>
  );
}
