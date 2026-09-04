import type { ReactElement } from 'react';
import { Box, ButtonBase, Typography } from '@exyconn/ui';
import type { DayScreenshot } from '@shared/types';
import { activityLabel } from '../activity';
import { formatTimeOfDay } from '../time';

interface Props {
  shots: readonly DayScreenshot[];
  /** The employee's chosen zone — a capture time is an instant, so it is read in it. */
  timezone: string;
  /** Clicking any shot opens the gallery WINDOW; this 420px column is no place to review them. */
  onOpen: () => void;
}

/** Thumbnails of one day's screenshots. Clicking one opens the separate gallery window. */
export default function ScreenshotGrid({ shots, timezone, onOpen }: Readonly<Props>): ReactElement {
  if (shots.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
        No screenshots on this day.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 1.5,
      }}
    >
      {shots.map((shot) => {
        const capturedAt = formatTimeOfDay(shot.capturedAt, timezone);
        return (
          <ButtonBase
            key={shot.id}
            onClick={onOpen}
            aria-label={`Open my screenshots — this one was captured at ${capturedAt}`}
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
              {capturedAt} · {activityLabel(shot.activityPercent)}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
