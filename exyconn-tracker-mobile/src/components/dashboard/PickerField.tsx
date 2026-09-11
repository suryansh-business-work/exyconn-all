import { useState } from 'react';
import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { FieldFrame } from '../form/FieldFrame';
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
  disabled: boolean;
  searchable?: boolean;
  onSelect: (value: string) => void;
}

/**
 * A picker that acts the moment a choice is made — the project and ticket the next session
 * books against. Not a form field: there is nothing to submit, the choice IS the command.
 */
export function PickerField({
  id,
  label,
  options,
  selected,
  placeholder,
  hint,
  disabled,
  searchable = false,
  onSelect,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === selected);
  const shown = current?.label ?? placeholder;

  return (
    <FieldFrame id={id} label={label} hint={hint}>
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
          borderColor="$hairline"
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
