import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';

interface SortSelectProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/** How an email list is ordered. */
export function SortSelect<T extends string>({
  value,
  options,
  onChange,
}: Readonly<SortSelectProps<T>>) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      label={t('Sort')}
      value={value}
      onChange={(event) => {
        const chosen = options.find((option) => option.value === event.target.value);
        if (chosen) {
          onChange(chosen.value);
        }
      }}
      sx={{ minWidth: 170 }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {t(option.label)}
        </MenuItem>
      ))}
    </TextField>
  );
}
