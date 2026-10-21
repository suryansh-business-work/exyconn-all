import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { MARK_WORDS } from '@exyconn/tracker-core';
import { Box, CardActionArea, Text } from '@/components/ui';
import { formatDuration, activityPercent } from './tracker.format';
import type { TrackerDayCell } from './buildTrackerMonth';
import type { TrackerDayMark } from './tracker.types';
import { STATUS_ICONS, useStatusColors } from './tracker.status';

/** Every tile is this tall, whatever its status or text, so the month reads as an even grid. */
const TILE_HEIGHT = { xs: 64, sm: 104 };

interface TrackerDayTileProps {
  cell: TrackerDayCell;
  selected: boolean;
  /** The day's status; undefined for no data or a future day. */
  mark: TrackerDayMark | undefined;
  /** What the off day is called: the leave code (EL, CL) or the holiday's name. */
  offLabel: string | undefined;
  onSelect: (date: string) => void;
}

/**
 * One day of the month: its status in colour (border and tint), icon and words, the time worked
 * (measured plus approved off-computer work, also on a week off) and how active it was.
 */
export function TrackerDayTile({
  cell,
  selected,
  mark,
  offLabel,
  onSelect,
}: Readonly<TrackerDayTileProps>) {
  const t = useT();
  const colors = useStatusColors();
  const { bucket } = cell;
  const status = mark ? colors(mark) : undefined;
  const word = mark ? (offLabel ?? t(MARK_WORDS[mark])) : undefined;
  const workedMs = bucket ? bucket.activeMs + (bucket.manualMs ?? 0) : 0;
  const spoken = [
    format(cell.date, 'EEEE d MMMM'),
    word,
    bucket ? formatDuration(workedMs) : undefined,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <CardActionArea
      disabled={!cell.inMonth}
      onClick={() => onSelect(cell.dateKey)}
      aria-label={spoken}
      aria-pressed={selected}
      sx={{ borderRadius: 1, opacity: cell.inMonth ? 1 : 0.4, height: '100%' }}
    >
      <Box
        data-status={mark}
        sx={{
          height: TILE_HEIGHT,
          p: { xs: 0.5, sm: 1 },
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 1,
          border: 2,
          borderColor: status?.hue ?? 'divider',
          bgcolor: status?.tint ?? 'transparent',
          outline: selected ? 2 : 0,
          outlineStyle: 'solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text size="sm" weight={cell.isToday ? 'bold' : 'medium'}>
            {format(cell.date, 'd')}
          </Text>
          {mark && (
            <Box
              aria-hidden
              sx={{ display: 'flex', fontSize: { xs: 14, sm: 18 }, color: status?.hue }}
            >
              {STATUS_ICONS[mark]}
            </Box>
          )}
        </Box>
        {word && (
          <Text size="caption" weight="medium" noWrap title={word}>
            {word}
          </Text>
        )}
        {bucket && (
          <>
            <Text
              size="caption"
              weight="medium"
              noWrap
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {formatDuration(workedMs)}
            </Text>
            {/* The percentage is the first thing to go when there is no room for it; the day
                panel says it in full for whichever day is open. */}
            <Text
              size="caption"
              color="text.secondary"
              noWrap
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {t('{percent}% active', { percent: activityPercent(bucket.activeMs, bucket.idleMs) })}
            </Text>
          </>
        )}
      </Box>
    </CardActionArea>
  );
}
