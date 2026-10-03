import { MenuItem, Select } from '@exyconn/ui';
import type { FontOption } from './font-options';

interface FontSelectProps {
  label: string;
  /** The caret's current value; `''` for the default. */
  value: string;
  options: readonly FontOption[];
  disabled: boolean;
  minWidth: number;
  onChange: (value: string) => void;
}

/** A compact picker for one text-style attribute — the font family or the font size. */
export function FontSelect({
  label,
  value,
  options,
  disabled,
  minWidth,
  onChange,
}: Readonly<FontSelectProps>) {
  // A value pasted in from elsewhere is not in the list; show it as the default rather than blank.
  const known = options.some((option) => option.value === value) ? value : '';
  return (
    <Select
      size="small"
      value={known}
      disabled={disabled}
      displayEmpty
      inputProps={{ 'aria-label': label }}
      renderValue={(selected) => options.find((option) => option.value === selected)?.label}
      onChange={(event) => onChange(String(event.target.value))}
      sx={{ minWidth, fontSize: 14, '& .MuiSelect-select': { py: 0.5 } }}
    >
      {options.map((option) => (
        <MenuItem key={option.value || 'default'} value={option.value} dense>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}
