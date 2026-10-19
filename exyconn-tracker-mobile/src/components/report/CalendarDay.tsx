import { Pressable } from 'react-native';
import { YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { formatDayLabel, type DayMark, type Translate } from '@exyconn/tracker-core';
import type { CalendarCell } from '../../lib/report/calendar';
import { MARK_WORDS } from '../../lib/report/day-marks';
import { useBrand } from '../../theme/BrandProvider';
import { radius, trackerActivity, trackerSelected } from '../../theme/tokens';
import { Body, Caption } from '../ui/Typography';

interface Props {
  cell: CalendarCell;
  /** The ring each mark wears — worked out once by the calendar, for every cell. */
  markColors: Readonly<Record<DayMark, string>>;
  onSelect: (date: Date) => void;
}

const DOT = 5;
const MARK_RING = 2;

/** The cell's outline: a mark's ring, else today's thin accent ring, else none. */
function ringOf(
  cell: CalendarCell,
  markColors: Props['markColors'],
  today: string,
): { width: number; color: string } {
  if (cell.mark !== null) {
    return { width: MARK_RING, color: markColors[cell.mark] };
  }
  const width = cell.today && !cell.selected ? 1 : 0;
  return { width, color: today };
}

/** What the day is called aloud: its date, today, its activity, and its mark with its label. */
function spokenName(cell: CalendarCell, t: Translate): string {
  const spoken = [formatDayLabel(cell.date)];
  if (cell.today) {
    spoken.push(t('today'));
  }
  if (cell.level !== null) {
    spoken.push(t('has tracked time, {level} activity', { level: cell.level }));
  }
  if (cell.mark !== null) {
    spoken.push(t(MARK_WORDS[cell.mark]));
  }
  if (cell.label !== null) {
    spoken.push(cell.label);
  }
  return spoken.join(', ');
}

function textColorOf(cell: CalendarCell, selectedInk: string): string {
  if (cell.selected) {
    return selectedInk;
  }
  return cell.disabled ? '$muted' : '$ink';
}

/**
 * A round calendar cell, dotted in its activity colour when the employee tracked time that
 * day, and filled with the inverted ink when selected — the desktop's calendar. A marked day
 * (short, leave, holiday, week off) wears its ring, and a leave code or holiday name replaces
 * the dot. Blank outside the month.
 */
export function CalendarDay({ cell, markColors, onSelect }: Readonly<Props>) {
  const t = useT();
  const brand = useBrand();
  const pill = trackerSelected[brand.scheme];
  const dot = cell.level === null ? 'transparent' : trackerActivity[brand.scheme][cell.level];

  if (!cell.inMonth) {
    return <YStack flex={1} aspectRatio={1} />;
  }

  const ring = ringOf(cell, markColors, brand.primary);

  return (
    <Pressable
      style={{ flex: 1 }}
      disabled={cell.disabled}
      onPress={() => onSelect(cell.date)}
      accessibilityRole="button"
      accessibilityLabel={spokenName(cell, t)}
      accessibilityState={{ selected: cell.selected, disabled: cell.disabled }}
    >
      <YStack
        aspectRatio={1}
        margin="$0.5"
        alignItems="center"
        justifyContent="center"
        borderRadius={radius.pill}
        borderWidth={ring.width}
        borderColor={ring.color}
        backgroundColor={cell.selected ? pill.fill : 'transparent'}
        opacity={cell.disabled ? 0.45 : 1}
      >
        <Body fontWeight="600" color={textColorOf(cell, pill.ink)}>
          {cell.dayOfMonth}
        </Body>
        {cell.label === null ? (
          <YStack
            width={DOT}
            height={DOT}
            borderRadius={DOT}
            marginTop="$0.5"
            backgroundColor={dot}
          />
        ) : (
          // The leave code (CL) or the holiday's name, in place of the dot.
          <Caption
            size="$1"
            numberOfLines={1}
            paddingHorizontal="$0.5"
            color={textColorOf(cell, pill.ink)}
          >
            {cell.label}
          </Caption>
        )}
      </YStack>
    </Pressable>
  );
}
