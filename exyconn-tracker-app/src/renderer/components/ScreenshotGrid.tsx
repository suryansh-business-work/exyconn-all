import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { DayScreenshot } from '@shared/types';
import { formatTime } from '../format';
import ScreenshotDialog from './ScreenshotDialog';

interface Props {
  shots: readonly DayScreenshot[];
}

/** Thumbnails of one day's screenshots; clicking one opens it full-size. */
export default function ScreenshotGrid({ shots }: Readonly<Props>): JSX.Element {
  const [open, setOpen] = useState<DayScreenshot | null>(null);

  if (shots.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
        No screenshots on this day.
      </Typography>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 1.5,
        }}
      >
        {shots.map((shot) => {
          const capturedAt = formatTime(shot.capturedAt);
          return (
            <ButtonBase
              key={shot.id}
              onClick={() => setOpen(shot)}
              aria-label={`Open screenshot captured at ${capturedAt}`}
              sx={{
                display: 'block',
                width: '100%',
                borderRadius: '4px',
                textAlign: 'left',
                transition: 'transform 180ms ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <Box
                component="img"
                src={shot.imageUrl}
                alt={`Screenshot captured at ${capturedAt}`}
                loading="lazy"
                sx={(theme) => ({
                  width: '100%',
                  aspectRatio: '16 / 10',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '4px',
                  border: `1px solid ${theme.palette.divider}`,
                })}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {capturedAt}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      <ScreenshotDialog shot={open} onClose={() => setOpen(null)} />
    </>
  );
}
