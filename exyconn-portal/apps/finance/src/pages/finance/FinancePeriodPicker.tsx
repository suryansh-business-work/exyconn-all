import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import type { FinancePeriod } from './finance-period';

interface Props {
  periods: readonly FinancePeriod[];
  value: string;
  onChange: (key: string) => void;
}

/** Which window the dashboard is reporting on. Every figure below it follows this. */
export function FinancePeriodPicker({ periods, value, onChange }: Readonly<Props>) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      label={t('Period')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 180 }}
    >
      {periods.map((period) => (
        <MenuItem key={period.key} value={period.key}>
          {t(period.label)}
        </MenuItem>
      ))}
    </TextField>
  );
}
