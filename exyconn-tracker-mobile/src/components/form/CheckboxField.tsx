import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Checkbox, Label, XStack } from 'tamagui';
import { useBrand } from '../../theme/BrandProvider';
import { Icon } from '../ui/Icon';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
}

/** A labelled checkbox bound to React Hook Form. The whole row is the tap target. */
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
    <XStack gap="$3" alignItems="center">
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={(next) => field.onChange(next === true)}
        disabled={disabled}
        backgroundColor={checked ? brand.primary : '$paper'}
        borderColor={checked ? brand.primary : '$hairline'}
        accessibilityLabel={label}
      >
        <Checkbox.Indicator>
          <Icon name="check" size={16} color={brand.onPrimary} />
        </Checkbox.Indicator>
      </Checkbox>
      <Label htmlFor={name} size="$3" color="$ink" flex={1}>
        {label}
      </Label>
    </XStack>
  );
}
