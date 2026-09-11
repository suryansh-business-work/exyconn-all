import { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { XStack, YStack } from 'tamagui';
import { formatDayLabel } from '@exyconn/tracker-core';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { Icon } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

interface Props {
  selected: Date;
  /** Today; the employee cannot look into the future. */
  maxDate: Date;
  onSelect: (date: Date) => void;
}

/**
 * "Jump to date" — the platform's own date picker (Android's dialog, iOS's inline calendar), for
 * reaching a day months back without paging there. The picked value is a calendar date, so it
 * is shown through the day formatter, never re-zoned.
 */
export function JumpToDate({ selected, maxDate, onSelect }: Readonly<Props>) {
  const [iosOpen, setIosOpen] = useState(false);
  const label = formatDayLabel(selected);

  const commit = (event: DateTimePickerEvent, date: Date | undefined): void => {
    if (event.type === 'set' && date !== undefined && !Number.isNaN(date.getTime())) {
      setIosOpen(false);
      onSelect(date);
    }
  };

  const open = (): void => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        maximumDate: maxDate,
        onChange: commit,
      });
      return;
    }
    setIosOpen((shown) => !shown);
  };

  return (
    <YStack gap="$1.5">
      <Caption fontWeight="600" color="$ink">
        Jump to date
      </Caption>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Jump to date: ${label}`}
        accessibilityState={{ expanded: iosOpen }}
      >
        <XStack
          borderWidth={1}
          borderColor="$hairline"
          borderRadius={TRACKER_RADIUS}
          backgroundColor="$paper"
          padding="$3"
          alignItems="center"
        >
          <Body flex={1}>{label}</Body>
          <Icon name="calendar-search" />
        </XStack>
      </Pressable>
      {iosOpen ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="inline"
          maximumDate={maxDate}
          onChange={commit}
        />
      ) : null}
    </YStack>
  );
}
