import { Pressable } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Checkbox, XStack } from 'tamagui';
import { useBrand } from '../../theme/BrandProvider';
import { Icon } from '../ui/Icon';
import { Body } from '../ui/Typography';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
}

/**
 * A labelled checkbox bound to React Hook Form. The whole row is the tap target and the one
 * thing a screen reader stops on — "checkbox, checked, <label>" — so the box and its label are
 * never read as two separate, half-named elements. (On a phone a Label's `htmlFor` only focuses
 * text inputs, and its own press handler swallowed taps on the text, so it is plain text here.)
 */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
}: Readonly<Props<T>>) {
  const { field } = useController({ control, name });
  const brand = useBrand();
  const checked = field.value === true;

  return (
    <Pressable
      onPress={() => field.onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
    >
      <XStack gap="$3" alignItems="center">
        <Checkbox
          id={name}
          checked={checked}
          disabled={disabled}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          backgroundColor={checked ? brand.primary : '$paper'}
          borderColor={checked ? brand.primary : '$control'}
        >
          <Checkbox.Indicator>
            <Icon name="check" size={16} color={brand.onPrimary} />
          </Checkbox.Indicator>
        </Checkbox>
        <Body size="$3" flex={1}>
          {label}
        </Body>
      </XStack>
    </Pressable>
  );
}
