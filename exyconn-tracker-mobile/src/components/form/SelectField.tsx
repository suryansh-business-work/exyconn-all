import { useState } from 'react';
import { Pressable } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { XStack } from 'tamagui';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { Icon } from '../ui/Icon';
import { OptionSheet, type Option } from '../ui/OptionSheet';
import { Body } from '../ui/Typography';
import { FieldFrame } from './FieldFrame';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly Option[];
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  /** Runs after the form value changes — e.g. reload the tickets for a new project. */
  onChanged?: (value: string) => void;
}

/** A picker bound to React Hook Form: the current choice in a field, the list in a sheet. */
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  hint,
  placeholder = 'Choose…',
  disabled = false,
  searchable = false,
  onChanged,
}: Readonly<Props<T>>) {
  const { field, fieldState } = useController({ control, name });
  const [open, setOpen] = useState(false);
  const value = String(field.value ?? '');
  const current = options.find((option) => option.value === value);

  return (
    <FieldFrame id={name} label={label} hint={hint} error={fieldState.error?.message}>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        accessibilityHint="Opens the list of choices"
      >
        <XStack
          borderWidth={1}
          borderColor={fieldState.error === undefined ? '$hairline' : '$error'}
          borderRadius={TRACKER_RADIUS}
          backgroundColor="$paper"
          padding="$3"
          alignItems="center"
          opacity={disabled ? 0.55 : 1}
        >
          <Body flex={1} color={current === undefined ? '$muted' : '$ink'} numberOfLines={1}>
            {current?.label ?? placeholder}
          </Body>
          <Icon name="chevron-down" />
        </XStack>
      </Pressable>
      <OptionSheet
        open={open}
        title={label}
        options={options}
        selected={value}
        searchable={searchable}
        onClose={() => setOpen(false)}
        onSelect={(next) => {
          field.onChange(next);
          onChanged?.(next);
        }}
      />
    </FieldFrame>
  );
}
