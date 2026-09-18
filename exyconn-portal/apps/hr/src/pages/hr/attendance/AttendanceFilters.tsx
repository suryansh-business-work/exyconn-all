import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Autocomplete, Button, Grid, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { DatePicker } from '@exyconn/ui/pickers';
import {
  AttendanceStatus,
  useListUsersQuery,
  useTrackerProjectOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import {
  EMPTY_ATTENDANCE_FILTERS,
  hasAttendanceFilters,
  type AttendanceFilterState,
} from './attendance.filters';

interface Option {
  id: string;
  label: string;
}

interface AttendanceFiltersProps {
  value: AttendanceFilterState;
  onChange: (next: AttendanceFilterState) => void;
}

const STATUSES = Object.values(AttendanceStatus);
const FIELD = { fullWidth: true, size: 'small' } as const;

/** Picks one option by id from a searchable list; clearing it means "any". */
function OptionFilter({
  label,
  options,
  value,
  onChange,
}: Readonly<{
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}>) {
  const selected = options.find((option) => option.id === value) ?? null;
  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_event, next) => onChange(next?.id ?? '')}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
    />
  );
}

/** Status, employee, project and date range above the attendance register. */
export function AttendanceFilters({ value, onChange }: Readonly<AttendanceFiltersProps>) {
  const t = useT();
  const { data: usersData } = useListUsersQuery();
  const { data: projectsData } = useTrackerProjectOptionsQuery();

  const employees = useMemo<Option[]>(
    () => (usersData?.listUsers ?? []).map((user) => ({ id: user.id, label: user.name })),
    [usersData],
  );
  const projects = useMemo<Option[]>(
    () =>
      (projectsData?.trackerProjectOptions ?? []).map((project) => ({
        id: project.id,
        label: project.key ? `${project.key} · ${project.name}` : project.name,
      })),
    [projectsData],
  );

  const set = <K extends keyof AttendanceFilterState>(key: K, next: AttendanceFilterState[K]) =>
    onChange({ ...value, [key]: next });
  const toBeforeFrom = Boolean(value.from && value.to && value.to < value.from);

  return (
    <Grid container spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <TextField
          select
          {...FIELD}
          label={t('Status')}
          value={value.status}
          onChange={(event) => set('status', event.target.value)}
        >
          <MenuItem value="">{t('All statuses')}</MenuItem>
          {STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(status.replaceAll('_', ' '))}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
        <OptionFilter
          label={t('Employee')}
          options={employees}
          value={value.employeeId}
          onChange={(id) => set('employeeId', id)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
        <OptionFilter
          label={t('Project')}
          options={projects}
          value={value.projectId}
          onChange={(id) => set('projectId', id)}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 1.75 }}>
        <DatePicker
          label={t('From')}
          value={value.from}
          onChange={(next) => set('from', next)}
          slotProps={{ textField: FIELD, field: { clearable: true } }}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 1.75 }}>
        <DatePicker
          label={t('To')}
          value={value.to}
          minDate={value.from ?? undefined}
          onChange={(next) => set('to', next)}
          slotProps={{
            textField: {
              ...FIELD,
              error: toBeforeFrom,
              helperText: toBeforeFrom ? t('Must be on or after From') : undefined,
            },
            field: { clearable: true },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 1.5 }}>
        <Button
          fullWidth
          variant="text"
          disabled={!hasAttendanceFilters(value)}
          onClick={() => onChange(EMPTY_ATTENDANCE_FILTERS)}
        >
          {t('Clear filters')}
        </Button>
      </Grid>
    </Grid>
  );
}
