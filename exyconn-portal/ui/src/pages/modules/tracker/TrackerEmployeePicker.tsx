import { Autocomplete, TextField } from '@/components/ui';

/** One selectable employee for the tracker picker. */
export interface EmployeeOption {
  id: string;
  label: string;
}

interface TrackerEmployeePickerProps {
  options: EmployeeOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}

/** Searchable employee selector for whose tracker data to view. */
export function TrackerEmployeePicker({
  options,
  value,
  onChange,
}: Readonly<TrackerEmployeePickerProps>) {
  const selected = options.find((option) => option.id === value) ?? null;
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      value={selected}
      onChange={(_event, option) => onChange(option ? option.id : null)}
      sx={{ minWidth: { xs: '100%', sm: 300 } }}
      renderInput={(params) => <TextField {...params} label="Employee" />}
    />
  );
}
