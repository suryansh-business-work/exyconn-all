import type { ReactElement } from 'react';
import { createContext, useContext } from 'react';
import { Box, PickerDay, Tooltip, trackerActivity, useTheme, type Theme } from '@exyconn/ui';
import type { PickerDayProps } from '@exyconn/ui';
import {
  formatDayLabel,
  formatHoursMinutes,
  type ActivityLevel,
  type DayMark,
} from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { selectedFill } from '../theme';

/** How much a day tracked, and how active that time was. */
export interface TrackedDate {
  level: ActivityLevel;
  trackedMs: number;
}

/**
 * The `yyyy-MM-dd` keys of the days that have tracked time, with how much and how active. Passed
 * by context rather than `slotProps.day` because MUI types that slot as exactly
 * `PickerDayProps` — smuggling an extra prop through it needs an `any` cast, which this repo bans.
 */
export const TrackedDatesContext = createContext<ReadonlyMap<string, TrackedDate>>(new Map());

/** Leave, holidays, week offs and finished days short of the contract, by `yyyy-MM-dd` key. */
export const DayMarksContext = createContext<ReadonlyMap<string, DayMark>>(new Map());

/** What an off day is called — the leave code (CL, EL) or the holiday's name — by date key. */
export const DayLabelsContext = createContext<ReadonlyMap<string, string>>(new Map());

/** What a mark adds to the day's name, so the ring is heard as well as seen. */
const MARK_WORDS: Readonly<Record<DayMark, string>> = {
  SHORT: 'below expected hours',
  LEAVE: 'on leave',
  HOLIDAY: 'holiday',
  WEEK_OFF: 'week off',
};

/**
 * The ring a marked day wears (also drawn by the legend): red when short, the accent for
 * leave, grey for a holiday, and a grey hairline for a week off.
 */
export function markRing(mark: DayMark, theme: Theme): string {
  if (mark === 'WEEK_OFF') {
    return `inset 0 0 0 1px ${theme.palette.text.secondary}`;
  }
  let color = theme.palette.text.secondary;
  if (mark === 'SHORT') {
    color = theme.palette.error.main;
  } else if (mark === 'LEAVE') {
    color = theme.palette.info.main;
  }
  return `inset 0 0 0 2px ${color}`;
}

interface FooterProps {
  label: string | undefined;
  level: ActivityLevel | undefined;
}

/** Under the date: the off day's name (CL, a holiday) when it has one, else the activity dot. */
function DayFooter({ label, level }: Readonly<FooterProps>): ReactElement | null {
  const theme = useTheme();
  const placed = {
    position: 'absolute',
    left: '50%',
    bottom: 1,
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  } as const;
  if (label !== undefined) {
    return (
      <Box
        aria-hidden
        sx={{
          ...placed,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: theme.typography.pxToRem(8),
          lineHeight: 1,
          fontWeight: 700,
          color: 'text.secondary',
        }}
      >
        {label}
      </Box>
    );
  }
  if (level === undefined) {
    return null;
  }
  return (
    <Box
      aria-hidden
      sx={{
        ...placed,
        bottom: 3,
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: trackerActivity[theme.palette.mode][level],
      }}
    />
  );
}

/** The mark in words, with the off day's own name when it has one: "on leave (CL)". */
function markWords(
  mark: DayMark,
  label: string | undefined,
  t: (source: string) => string,
): string {
  const words = t(MARK_WORDS[mark]);
  return label === undefined ? words : `${words} (${label})`;
}

/** The dot's colour, in words, so a screen reader hears what a sighted user sees. */
const DAY_NAME_TEMPLATES: Readonly<Record<ActivityLevel, string>> = {
  low: '{date}, {duration} tracked, low activity',
  medium: '{date}, {duration} tracked, medium activity',
  high: '{date}, {duration} tracked, high activity',
};

/** Local calendar key, matching the portal's timezone-bucketed `ReportDay.date`. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * A round calendar cell, dotted in its activity colour when the employee tracked time, ringed
 * when it is marked, and captioned with an off day's name in place of the dot.
 */
export default function TrackedDay({
  day,
  outsideCurrentMonth,
  ...rest
}: Readonly<PickerDayProps>): ReactElement {
  const theme = useTheme();
  const t = useT();
  const tracked = useContext(TrackedDatesContext);
  const marks = useContext(DayMarksContext);
  const labels = useContext(DayLabelsContext);
  const entry = outsideCurrentMonth ? undefined : tracked.get(dateKey(day));
  const mark = outsideCurrentMonth ? undefined : marks.get(dateKey(day));
  const label = outsideCurrentMonth ? undefined : labels.get(dateKey(day));
  const trackedName =
    entry === undefined
      ? undefined
      : t(DAY_NAME_TEMPLATES[entry.level], {
          date: formatDayLabel(day),
          duration: formatHoursMinutes(entry.trackedMs),
        });
  const baseName = trackedName ?? formatDayLabel(day);
  const dayName = mark === undefined ? trackedName : `${baseName}, ${markWords(mark, label, t)}`;
  const ring = mark === undefined ? undefined : markRing(mark, theme);
  const weekOff = mark === 'WEEK_OFF' ? t('Week off') : undefined;
  const caption = label ?? weekOff;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* The off day's name (CL, a holiday) on hover; describeChild keeps the day's own name. */}
      <Tooltip title={caption ?? ''} describeChild>
        <PickerDay
          {...rest}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          aria-label={dayName}
          sx={{
            borderRadius: '50%',
            fontWeight: 600,
            boxShadow: ring,
            '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected:focus': selectedFill(theme),
          }}
        />
      </Tooltip>
      <DayFooter label={caption} level={entry?.level} />
    </Box>
  );
}
