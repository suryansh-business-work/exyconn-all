import type { ReactElement } from 'react';
import { Box, ButtonBase, Chip, LinearProgress, Stack, Tooltip, Typography } from '@exyconn/ui';
import BlurOnRounded from '@mui/icons-material/BlurOnRounded';
import type { DayScreenshot } from '@shared/types';
import { activityColor, activityLabel } from '../activity';
import { formatDateTime } from '../time';
import Surface from './Surface';

interface Props {
  shot: DayScreenshot;
  timezone: string;
  /** Opens this shot full screen — a 300px thumbnail shows that it exists, not what it caught. */
  onOpen: () => void;
}

const PENDING_HINT =
  'Activity is measured over the interval this screenshot belongs to. A screenshot is uploaded from inside its interval, so a shot that has landed before its interval reads 0% until the next sync.';

/** One screenshot, with the activity level of its interval and the time it was captured. */
export default function ScreenshotCard({ shot, timezone, onOpen }: Readonly<Props>): ReactElement {
  const capturedAt = formatDateTime(shot.capturedAt, timezone);

  return (
    <Surface sx={{ p: 1.5 }}>
      <ButtonBase
        onClick={onOpen}
        aria-label={`Open the screenshot captured at ${capturedAt} full screen`}
        sx={{
          display: 'block',
          width: '100%',
          borderRadius: '4px',
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
      </ButtonBase>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 1.25 }}
      >
        <Typography variant="body2" noWrap title={capturedAt}>
          {capturedAt}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {shot.blurred ? (
            <Tooltip title="Blurred by your workspace's settings">
              <BlurOnRounded fontSize="small" sx={{ color: 'text.secondary' }} />
            </Tooltip>
          ) : null}
          <Tooltip title={PENDING_HINT}>
            <Chip
              size="small"
              variant="outlined"
              color={activityColor(shot.activityPercent)}
              label={activityLabel(shot.activityPercent)}
            />
          </Tooltip>
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={shot.activityPercent}
        color={activityColor(shot.activityPercent)}
        sx={{ mt: 1 }}
      />
    </Surface>
  );
}
