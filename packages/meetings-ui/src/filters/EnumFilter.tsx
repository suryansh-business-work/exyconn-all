import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';

interface EnumFilterProps {
  label: string;
  values: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/** A select over an enum's values, with "Any" to clear it. */
export function EnumFilter({ label, values, value, onChange }: Readonly<EnumFilterProps>) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      sx={{ minWidth: 160 }}
      label={t(label)}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <MenuItem value="">{t('Any')}</MenuItem>
      {enumOptions(values).map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {t(option.label)}
        </MenuItem>
      ))}
    </TextField>
  );
}
