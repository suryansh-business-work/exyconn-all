import type { ReactElement } from 'react';
import { Box, Stack, Tooltip, Typography, iconSize, letterSpacing } from '@exyconn/ui';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { ProgressStyle, WorkProfile, Workday } from '@shared/types';
import GradientBar from './GradientBar';
import ProgressRing from './ProgressRing';
import { DEFAULT_WORK_HOURS, formatHoursMinutes } from '@exyconn/tracker-core';

interface Props {
  workday: Workday | null;
  workProfile: WorkProfile | null;
  /** Worked today INCLUDING the session in progress — the live number, not the synced one. */
  activeMs: number;
  /** Bar across the card, or a ring around the figure. The employee's own choice. */
  style: ProgressStyle;
}

/** What the day amounts to, worked out once and drawn either way. */
interface DayFigures {
  percent: number;
  targetMs: number;
  remainingMs: number;
  done: boolean;
  hours: number;
}

function figuresFor(
  workday: Workday | null,
  workProfile: WorkProfile | null,
  activeMs: number,
): DayFigures {
  const targetMs = workday?.targetMs ?? workProfile?.targetMs ?? 0;
  const remainingMs = Math.max(0, targetMs - activeMs);
  return {
    targetMs,
    remainingMs,
    percent: targetMs > 0 ? Math.min(100, Math.round((activeMs / targetMs) * 100)) : 0,
    done: remainingMs === 0 && targetMs > 0,
    hours: workProfile?.workHoursPerDay ?? DEFAULT_WORK_HOURS,
  };
}

/** The sentence under either shape: how far in, or that the day is done. */
function summaryOf(figures: DayFigures): string {
  if (figures.done) {
    return `Full ${figures.hours}h day complete.`;
  }
  return `${figures.percent}% — ${formatHoursMinutes(figures.remainingMs)} left of your ${figures.hours}h day.`;
}

interface ShapeProps {
  figures: DayFigures;
  activeMs: number;
}

/** The big figure over a gradient bar that fills towards the day's target. */
function DayProgressBar({ figures, activeMs }: Readonly<ShapeProps>): ReactElement {
  return (
    <Stack spacing={1.5}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          letterSpacing: letterSpacing.tighter,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatHoursMinutes(activeMs)}
      </Typography>
      <GradientBar
        percent={figures.percent}
        label="Worked"
        trailing={`of ${formatHoursMinutes(figures.targetMs)}`}
        ariaLabel={`${formatHoursMinutes(activeMs)} of ${formatHoursMinutes(figures.targetMs)} worked today`}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {summaryOf(figures)}
      </Typography>
    </Stack>
  );
}

/** The ring: the percentage sits inside the shape that describes it. */
function DayProgressRing({ figures, activeMs }: Readonly<ShapeProps>): ReactElement {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        mt: 1,
      }}
    >
      <ProgressRing
        value={figures.percent}
        label={`${figures.percent}%`}
        caption={formatHoursMinutes(activeMs)}
        color={figures.done ? 'success' : 'primary'}
      />
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          flex: 1,
          minWidth: 0,
        }}
      >
        {summaryOf(figures)}
      </Typography>
    </Stack>
  );
}

/**
 * How much of today's contracted day is done, at the top of the tracker.
 *
 * Active time only: idle minutes are time at a desk, not time worked, and a bar that counted
 * them would fill on its own while nobody was there. The target comes from HR's employee
 * record — the app states where it came from rather than presenting 8 hours as its own idea,
 * because an employee who thinks the tracker invented their working day has no way to
 * challenge it.
 *
 * The bar and the ring are the same number in two shapes, and which one appears is the
 * employee's own setting: both are read at a glance, and which reads faster is a fact about
 * the person looking, not about the data.
 */
export default function DayProgress({
  workday,
  workProfile,
  activeMs,
  style,
}: Readonly<Props>): ReactElement {
  const figures = figuresFor(workday, workProfile, activeMs);

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Worked today
          </Typography>
          <Tooltip
            title={`Your working day is ${figures.hours} hours, set by HR on your employee record. The default is ${DEFAULT_WORK_HOURS}. Only ACTIVE time counts — idle minutes do not fill this bar.`}
          >
            <InfoOutlined sx={{ fontSize: iconSize.md, color: 'text.secondary' }} />
          </Tooltip>
        </Stack>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: figures.done ? 'success.main' : 'primary.main' }}
        >
          {figures.percent}%
        </Typography>
      </Stack>

      {style === 'ring' ? (
        <DayProgressRing figures={figures} activeMs={activeMs} />
      ) : (
        <Box sx={{ mt: 1 }}>
          <DayProgressBar figures={figures} activeMs={activeMs} />
        </Box>
      )}
    </Box>
  );
}
