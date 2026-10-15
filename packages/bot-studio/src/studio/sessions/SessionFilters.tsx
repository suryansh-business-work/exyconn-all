import { useT } from '@exyconn/i18n';
import { MenuItem, Stack, TextField } from '@exyconn/shell/components/ui';
import type { IndustryOption } from '../shared/useIndustries';

/** The empty value of a filter select: "any". */
export const ANY = '';

/** Session states as the server reports them (active = an event in the last 30 minutes). */
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
] as const;

export interface SessionFilterValues {
  industry: string;
  status: string;
}

interface SessionFiltersProps {
  values: SessionFilterValues;
  industries: readonly IndustryOption[];
  onChange: (next: SessionFilterValues) => void;
}

const FIELD_SX = { minWidth: { sm: 200 }, width: { xs: '100%', sm: 'auto' } } as const;

/** Industry and status selects for the session log; the user is found with the grid's search. */
export function SessionFilters({ values, industries, onChange }: Readonly<SessionFiltersProps>) {
  const t = useT();
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        select
        size="small"
        label={t('Industry')}
        value={values.industry}
        onChange={(event) => onChange({ ...values, industry: event.target.value })}
        sx={FIELD_SX}
      >
        <MenuItem value={ANY}>{t('All industries')}</MenuItem>
        {industries.map((option) => (
          <MenuItem key={option.key} value={option.key}>
            {option.industry}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label={t('Status')}
        value={values.status}
        onChange={(event) => onChange({ ...values, status: event.target.value })}
        sx={FIELD_SX}
      >
        <MenuItem value={ANY}>{t('Any status')}</MenuItem>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
