import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';

/** The window a server tab reads, in days, from the choices it offers. */
export function McpPeriodSelect({
  days,
  windows,
  onChange,
}: Readonly<{ days: number; windows: readonly number[]; onChange: (days: number) => void }>) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      label={t('Period')}
      value={days}
      onChange={(event) => onChange(Number(event.target.value))}
      sx={{ minWidth: 180 }}
    >
      {windows.map((value) => (
        <MenuItem key={value} value={value}>
          {t('Last {count} days', { count: value })}
        </MenuItem>
      ))}
    </TextField>
  );
}
