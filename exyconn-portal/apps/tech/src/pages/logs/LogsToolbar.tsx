import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useT } from '@exyconn/i18n';
import { Button, Flex, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { LOG_FILTERS, enumLabel, type LogFilterSpec, type LogFilterValues } from './logs.constants';

interface Props {
  filters: LogFilterValues;
  onChange: (next: LogFilterValues) => void;
  onCopyOpenErrors: () => void;
  copying: boolean;
}

interface FilterSelectProps {
  spec: LogFilterSpec;
  value: string;
  onChange: (value: string) => void;
}

function FilterSelect({ spec, value, onChange }: Readonly<FilterSelectProps>) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      label={t(spec.label)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 150 }}
    >
      <MenuItem value="">{t('All')}</MenuItem>
      {spec.values.map((option) => (
        <MenuItem key={option} value={option}>
          {t(enumLabel(option))}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** Source, level and status scopes, and the one-click hand-off of every open error to Claude. */
export function LogsToolbar({ filters, onChange, onCopyOpenErrors, copying }: Readonly<Props>) {
  const t = useT();
  return (
    <Flex direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {LOG_FILTERS.map((spec) => (
        <FilterSelect
          key={spec.field}
          spec={spec}
          value={filters[spec.field]}
          onChange={(value) => onChange({ ...filters, [spec.field]: value })}
        />
      ))}
      <Button
        variant="outlined"
        startIcon={<SmartToyIcon />}
        onClick={onCopyOpenErrors}
        disabled={copying}
      >
        {t('Copy open errors for Claude')}
      </Button>
    </Flex>
  );
}
