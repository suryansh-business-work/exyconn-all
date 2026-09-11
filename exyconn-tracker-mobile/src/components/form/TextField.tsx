import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input, XStack } from 'tamagui';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { AppButton } from '../ui/AppButton';
import { FieldFrame } from './FieldFrame';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Password entry, with a Show/Hide toggle. */
  secret?: boolean;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  onSubmitEditing?: () => void;
}

/** A text input bound to React Hook Form; its Zod error replaces the hint when there is one. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  placeholder,
  disabled = false,
  secret = false,
  multiline = false,
  keyboardType,
  autoComplete,
  autoCapitalize = 'sentences',
  onSubmitEditing,
}: Readonly<Props<T>>) {
  const { field, fieldState } = useController({ control, name });
  const [revealed, setRevealed] = useState(false);

  return (
    <FieldFrame id={name} label={label} hint={hint} error={fieldState.error?.message}>
      <XStack gap="$2" alignItems="center">
        <Input
          id={name}
          flex={1}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          disabled={disabled}
          secureTextEntry={secret && !revealed}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={secret ? 'none' : autoCapitalize}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          minHeight={multiline ? 96 : undefined}
          textAlignVertical={multiline ? 'top' : 'center'}
          borderRadius={TRACKER_RADIUS}
          borderColor={fieldState.error === undefined ? '$hairline' : '$error'}
          backgroundColor="$paper"
          color="$ink"
          accessibilityLabel={label}
          aria-invalid={fieldState.error !== undefined}
        />
        {secret ? (
          <AppButton
            label={revealed ? 'Hide' : 'Show'}
            tone="text"
            onPress={() => setRevealed((shown) => !shown)}
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          />
        ) : null}
      </XStack>
    </FieldFrame>
  );
}
