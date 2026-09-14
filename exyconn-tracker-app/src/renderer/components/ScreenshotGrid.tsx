import type { ReactElement } from 'react';
import {
  borderWidth,
  Box,
  ButtonBase,
  duration,
  easing,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { DayScreenshot } from '@shared/types';
import { activityLabel, formatTimeOfDay } from '@exyconn/tracker-core';

interface Props {
  shots: readonly DayScreenshot[];
  /** The employee's chosen zone — a capture time is an instant, so it is read in it. */
  timezone: string;
  /** Clicking any shot opens the gallery WINDOW; this 420px column is no place to review them. */
  onOpen: () => void;
}

/** Thumbnails of one day's screenshots. Clicking one opens the separate gallery window. */
export default function ScreenshotGrid({ shots, timezone, onOpen }: Readonly<Props>): ReactElement {
  const t = useT();
  if (shots.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          py: 3,
        }}
      >
        {t('No screenshots on this day.')}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
        gap: 1.5,
      }}
    >
      {shots.map((shot) => {
        const capturedAt = formatTimeOfDay(shot.capturedAt, timezone);
        return (
          <ButtonBase
            key={shot.id}
            onClick={onOpen}
            aria-label={t('Open my screenshots — this one was captured at {time}', {
              time: capturedAt,
            })}
            sx={{
              display: 'block',
              width: '100%',
              borderRadius: `${TRACKER_RADIUS}px`,
              textAlign: 'left',
              transition: `transform ${duration.base}ms ${easing.standard}`,
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              component="img"
              src={shot.imageUrl}
              alt={t('Screenshot captured at {time}', { time: capturedAt })}
              loading="lazy"
              sx={(theme) => ({
                width: '100%',
                aspectRatio: '16 / 10',
                objectFit: 'cover',
                display: 'block',
                borderRadius: `${TRACKER_RADIUS}px`,
                border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
              })}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.5,
              }}
            >
              {capturedAt} · {activityLabel(t, shot.activityPercent)}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
