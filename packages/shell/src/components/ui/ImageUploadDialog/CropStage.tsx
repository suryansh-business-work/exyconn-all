import type { ReactNode } from 'react';
import { Box, color } from '@exyconn/ui';
import type { CropFill } from './crop-image';

interface CropStageProps {
  /** The image, for the blurred backdrop. */
  src: string;
  /** What the export paints around a zoomed-out image — previewed here live. */
  fill: CropFill;
  children: ReactNode;
}

/** The usual "transparent" checkerboard, in two light neutrals. */
const CHECKERBOARD = `repeating-conic-gradient(${color.neutral[100]} 0% 25%, ${color.white} 0% 50%) 0 0 / 16px 16px`;

/** The stage's own surface for a fill: a checkerboard, a colour, or (blur) a neutral base. */
const stageBackground = (fill: CropFill): string => {
  if (fill.kind === 'color') {
    return fill.color;
  }
  return fill.kind === 'none' ? CHECKERBOARD : color.neutral[900];
};

/**
 * The canvas the cropper sits on. Its background is the chosen fill, so the space around a
 * zoomed-out image already looks like the uploaded result.
 */
export function CropStage({ src, fill, children }: Readonly<CropStageProps>) {
  return (
    <Box
      data-testid="crop-stage"
      data-fill={fill.kind}
      sx={{
        position: 'relative',
        width: '100%',
        height: 280,
        borderRadius: 1,
        overflow: 'hidden',
        background: stageBackground(fill),
      }}
    >
      {fill.kind === 'blur' && (
        <Box
          component="img"
          src={src}
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(16px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      {children}
    </Box>
  );
}
