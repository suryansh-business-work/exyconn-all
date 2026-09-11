import { useState } from 'react';
import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { FieldFrame } from './FieldFrame';
import { Icon } from '../ui/Icon';
import { OptionSheet, type Option } from '../ui/OptionSheet';
import { Body } from '../ui/Typography';

interface Props {
  id: string;
  label: string;
  options: readonly Option[];
  selected: string;
  /** Shown in the field when nothing in `options` matches `selected`. */
  placeholder: string;
  hint?: string;
  /** A validation message; replaces the hint and outlines the field. */
  error?: string;
  disabled: boolean;
  searchable?: boolean;
  onSelect: (value: string) => void;
}

/**
 * The app's one picker: the current choice in a field, the list in a bottom sheet. Used bare
 * where the choice IS the command (the project and ticket the next session books against), and
 * wrapped by SelectField for React Hook Form.
 */
export function PickerField({
  id,
  label,
  options,
  selected,
  placeholder,
  hint,
  error,
  disabled,
  searchable = false,
  onSelect,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === selected);
  const shown = current?.label ?? placeholder;

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}`}
        accessibilityHint="Opens the list of choices"
        accessibilityState={{ disabled }}
      >
        <XStack
          borderWidth={1}
          borderColor={error === undefined ? '$hairline' : '$error'}
          borderRadius={TRACKER_RADIUS}
          backgroundColor="$paper"
          padding="$3"
          alignItems="center"
          opacity={disabled ? 0.55 : 1}
        >
          <Body flex={1} color={current === undefined ? '$muted' : '$ink'} numberOfLines={1}>
            {shown}
          </Body>
          <Icon name={disabled ? 'lock-outline' : 'chevron-down'} />
        </XStack>
      </Pressable>
      <OptionSheet
        open={open}
        title={label}
        options={options}
        selected={selected}
        searchable={searchable}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
      />
    </FieldFrame>
  );
}
