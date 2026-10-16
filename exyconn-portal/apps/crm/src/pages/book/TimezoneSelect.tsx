import { useMemo } from 'react';
import PublicIcon from '@mui/icons-material/Public';
import { timezoneOptions, useT } from '@exyconn/i18n';
import { Autocomplete, InputAdornment, TextField } from '@exyconn/shell/components/ui';

/** Which zone the times are shown in; the visitor's own to begin with. */
export function TimezoneSelect({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (zone: string) => void }>) {
  const t = useT();
  const options = useMemo(() => timezoneOptions(value), [value]);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return (
    <Autocomplete
      options={options}
      value={selected}
      disableClearable
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, chosen) => option.value === chosen.value}
      onChange={(_event, option) => onChange(option.value)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('Time zone')}
          size="small"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <PublicIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
