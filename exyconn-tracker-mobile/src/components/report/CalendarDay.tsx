import { Pressable } from 'react-native';
import { YStack } from 'tamagui';
import { formatDayLabel } from '@exyconn/tracker-core';
import type { CalendarCell } from '../../lib/report/calendar';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS } from '../../theme/tokens';
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
  if (cell.tracked) {
    parts.push('has tracked time');
  }
  return parts.join(', ');
}

function textColorOf(cell: CalendarCell, onPrimary: string): string {
  if (cell.selected) {
    return onPrimary;
  }
  return cell.disabled ? '$muted' : '$ink';
}

/** A calendar cell, dotted when the employee tracked time that day. Blank outside the month. */
export function CalendarDay({ cell, onSelect }: Readonly<Props>) {
  const brand = useBrand();

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
        borderRadius={TRACKER_RADIUS}
        borderWidth={cell.today && !cell.selected ? 1 : 0}
        borderColor={brand.primary}
        backgroundColor={cell.selected ? brand.primary : 'transparent'}
        opacity={cell.disabled ? 0.45 : 1}
      >
        <Body fontWeight={cell.selected ? '700' : '400'} color={textColorOf(cell, brand.onPrimary)}>
          {cell.dayOfMonth}
        </Body>
        <YStack
          width={DOT}
          height={DOT}
          borderRadius={DOT}
          marginTop="$0.5"
          backgroundColor={cell.selected ? brand.onPrimary : brand.secondary}
          opacity={cell.tracked ? 1 : 0}
        />
      </YStack>
    </Pressable>
  );
}
