import type { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { ListItemIcon, MenuItem, TextField } from '@/components/ui';
import type { SelectOption } from './types';

/** The menu value of the action item; it never reaches the form. */
const ACTION_VALUE = '__rhf-select-action__';

/** A last menu item that runs a command instead of picking a value, e.g. "Add email". */
interface RhfSelectAction {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}

interface RhfSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
  /** Marks the label with the required star; Zod still owns the rule. */
  required?: boolean;
  /** Shown after the options; choosing it leaves the value (and its validation) untouched. */
  action?: RhfSelectAction;
}

/** React Hook Form-bound MUI select with inline validation feedback. */
export function RhfSelect({
  name,
  label,
  options,
  helperText,
  required,
  action,
}: Readonly<RhfSelectProps>) {
  const { control } = useFormContext();
  const meta = useFieldMeta(name, { required, helperText });
  const copy = useFieldCopy();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          onChange={(event) => {
            if (event.target.value === ACTION_VALUE) {
              action?.onSelect();
              return;
            }
            field.onChange(event);
          }}
          value={field.value ?? ''}
          select
          fullWidth
          label={copy(label)}
          required={meta.required}
          error={Boolean(fieldState.error)}
          helperText={copy(fieldState.error?.message ?? meta.helperText)}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
          {action && (
            <MenuItem value={ACTION_VALUE} sx={{ borderTop: 1, borderColor: 'divider' }}>
              {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
              {copy(action.label)}
            </MenuItem>
          )}
        </TextField>
      )}
    />
  );
}
