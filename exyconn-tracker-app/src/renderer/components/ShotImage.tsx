import type { ReactElement } from 'react';
import { useState } from 'react';
import { borderWidth, Box, Skeleton, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props {
  src: string;
  alt: string;
}

type Stage = 'loading' | 'loaded' | 'failed';

const FILL = { position: 'absolute', inset: 0, width: '100%', height: '100%' } as const;

/**
 * A screenshot thumbnail, 16:10. The image comes from storage, not the app, so it holds a
 * skeleton until it has arrived and says so when it never does — never an empty frame.
 * Keyed on the shot by its parent, so a new shot starts loading afresh.
 */
export default function ShotImage({ src, alt }: Readonly<Props>): ReactElement {
  const t = useT();
  const [stage, setStage] = useState<Stage>('loading');

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        aspectRatio: '16 / 10',
        overflow: 'hidden',
        borderRadius: `${TRACKER_RADIUS}px`,
        border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
      })}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStage('loaded')}
        onError={() => setStage('failed')}
        sx={{ ...FILL, objectFit: 'cover', display: 'block' }}
      />
      {stage === 'loading' ? <Skeleton variant="rectangular" aria-hidden sx={FILL} /> : null}
      {stage === 'failed' ? (
        <Typography
          variant="caption"
          sx={{
            ...FILL,
            display: 'grid',
            placeItems: 'center',
            p: 1,
            textAlign: 'center',
            color: 'text.secondary',
            backgroundColor: 'background.paper',
          }}
        >
          {t('This screenshot could not be loaded.')}
        </Typography>
      ) : null}
    </Box>
  );
}
