import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import type { Option } from '../ui/OptionSheet';
import { PickerField } from './PickerField';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly Option[];
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Shows a spinner in the field — e.g. while the choice is being saved. */
  busy?: boolean;
  searchable?: boolean;
  /** Runs after the form value changes — e.g. reload the tickets for a new project. */
  onChanged?: (value: string) => void;
}

/** The app's picker bound to React Hook Form; its Zod error replaces the hint. */
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  hint,
  placeholder,
  disabled = false,
  busy = false,
  searchable = false,
  onChanged,
}: Readonly<Props<T>>) {
  const t = useT();
  const { field, fieldState } = useController({ control, name });
  return (
    <PickerField
      id={name}
      label={label}
      options={options}
      selected={String(field.value ?? '')}
      placeholder={placeholder ?? t('Choose…')}
      hint={hint}
      error={fieldState.error?.message}
      disabled={disabled}
      busy={busy}
      searchable={searchable}
      onSelect={(next) => {
        field.onChange(next);
        onChanged?.(next);
      }}
    />
  );
}
