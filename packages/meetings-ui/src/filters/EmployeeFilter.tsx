import { useT } from '@exyconn/i18n';
import { Autocomplete, TextField } from '@exyconn/shell/components/ui';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

interface EmployeeFilterProps {
  label: string;
  options: readonly SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/** A searchable person filter over the company's employees. */
export function EmployeeFilter({ label, options, value, onChange }: Readonly<EmployeeFilterProps>) {
  const t = useT();
  const selected = options.find((option) => option.value === value) ?? null;
  return (
    <Autocomplete
      size="small"
      sx={{ minWidth: 220 }}
      options={options}
      value={selected}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, chosen) => option.value === chosen.value}
      onChange={(_event, option) => onChange(option?.value ?? null)}
      renderInput={(params) => <TextField {...params} label={t(label)} />}
    />
  );
}
