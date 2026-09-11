import { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { XStack } from 'tamagui';
import { formatDateTime } from '@exyconn/tracker-core';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { Icon } from '../ui/Icon';
import { Body } from '../ui/Typography';
import { FieldFrame } from './FieldFrame';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  /** The zone every time in the app is shown in (the employee's, from the portal). */
  timezone: string;
  hint?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

/**
 * A date and time, bound to React Hook Form as an ISO instant. Picked with the platform's own
 * picker — Android's date then time dialogs, iOS's inline wheel — and SHOWN in the employee's
 * chosen zone through the same formatter as every other time in the app.
 */
export function DateTimeField<T extends FieldValues>({
  control,
  name,
  label,
  timezone,
  hint,
  maximumDate,
  minimumDate,
}: Readonly<Props<T>>) {
  const { field, fieldState } = useController({ control, name });
  const [iosOpen, setIosOpen] = useState(false);
  const iso = String(field.value ?? '');
  const value = iso === '' ? new Date() : new Date(iso);

  function commit(next: Date | undefined): void {
    if (next !== undefined) {
      field.onChange(next.toISOString());
    }
  }

  function openPicker(): void {
    if (Platform.OS !== 'android') {
      setIosOpen((open) => !open);
      return;
    }
    // Android has no combined picker: the date first, then the time on that date.
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate,
      minimumDate,
      onChange: (event, date) => {
        if (event.type !== 'set' || date === undefined) {
          return;
        }
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          onChange: (timeEvent, time) => commit(timeEvent.type === 'set' ? time : undefined),
        });
      },
    });
  }

  return (
    <FieldFrame id={name} label={label} hint={hint} error={fieldState.error?.message}>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${iso === '' ? 'not set' : formatDateTime(iso, timezone)}`}
      >
        <XStack
          borderWidth={1}
          borderColor={fieldState.error === undefined ? '$hairline' : '$error'}
          borderRadius={TRACKER_RADIUS}
          backgroundColor="$paper"
          padding="$3"
          alignItems="center"
        >
          <Body flex={1} color={iso === '' ? '$muted' : '$ink'}>
            {iso === '' ? 'Choose a date and time' : formatDateTime(iso, timezone)}
          </Body>
          <Icon name="calendar-clock" />
        </XStack>
      </Pressable>
      {iosOpen ? (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="inline"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(_event, date) => commit(date)}
        />
      ) : null}
    </FieldFrame>
  );
}
