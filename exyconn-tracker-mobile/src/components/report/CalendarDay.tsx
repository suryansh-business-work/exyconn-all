import { Pressable } from 'react-native';
import { YStack } from 'tamagui';
import { formatDayLabel } from '@exyconn/tracker-core';
import type { CalendarCell } from '../../lib/report/calendar';
import { useBrand } from '../../theme/BrandProvider';
import { radius, trackerActivity, trackerSelected } from '../../theme/tokens';
import { Body } from '../ui/Typography';

interface Props {
  cell: CalendarCell;
  onSelect: (date: Date) => void;
}

const DOT = 5;

function spokenLabel(cell: CalendarCell): string {
  const parts = [formatDayLabel(cell.date)];
  if (cell.today) {
    parts.push('today');
  }
  if (cell.level !== null) {
    parts.push(`has tracked time, ${cell.level} activity`);
  }
  return parts.join(', ');
}

function textColorOf(cell: CalendarCell, selectedInk: string): string {
  if (cell.selected) {
    return selectedInk;
  }
  return cell.disabled ? '$muted' : '$ink';
}

/**
 * A round calendar cell, dotted in its activity colour when the employee tracked time that
 * day, and filled with the inverted ink when selected — the desktop's calendar. Blank outside
 * the month.
 */
export function CalendarDay({ cell, onSelect }: Readonly<Props>) {
  const brand = useBrand();
  const pill = trackerSelected[brand.scheme];
  const dot = cell.level === null ? 'transparent' : trackerActivity[brand.scheme][cell.level];

  if (!cell.inMonth) {
    return <YStack flex={1} aspectRatio={1} />;
  }

  return (
    <Pressable
      style={{ flex: 1 }}
      disabled={cell.disabled}
      onPress={() => onSelect(cell.date)}
      accessibilityRole="button"
      accessibilityLabel={spokenLabel(cell)}
      accessibilityState={{ selected: cell.selected, disabled: cell.disabled }}
    >
      <YStack
        aspectRatio={1}
        margin="$0.5"
        alignItems="center"
        justifyContent="center"
        borderRadius={radius.pill}
        borderWidth={cell.today && !cell.selected ? 1 : 0}
        borderColor={brand.primary}
        backgroundColor={cell.selected ? pill.fill : 'transparent'}
        opacity={cell.disabled ? 0.45 : 1}
      >
        <Body fontWeight="600" color={textColorOf(cell, pill.ink)}>
          {cell.dayOfMonth}
        </Body>
        <YStack
          width={DOT}
          height={DOT}
          borderRadius={DOT}
          marginTop="$0.5"
          backgroundColor={dot}
        />
      </YStack>
    </Pressable>
  );
}
