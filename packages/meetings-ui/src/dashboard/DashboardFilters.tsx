import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Button, DatePicker, Flex } from '@exyconn/shell/components/ui';
import {
  MaLanguage,
  MaMeetingStatus,
  useListEmployeeOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { withParam } from '@exyconn/shell/utils/searchParams';
import { EmployeeFilter } from '../filters/EmployeeFilter';
import { EnumFilter } from '../filters/EnumFilter';
import type { MeetingScope } from '../lib/scope';
import { FILTER_PARAMS, dayParam, paramDay, type FilterParam } from './dashboard-filter';

/**
 * The dashboard's filters: a date range, the organizer (company-wide view only), a participant,
 * the call status and language. Each one is a URL param, so a filtered view can be linked to.
 */
export function DashboardFilters({ scope }: Readonly<{ scope: MeetingScope }>) {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const { data } = useListEmployeeOptionsQuery();
  const people = useMemo(
    () =>
      (data?.listEmployeeOptions ?? []).map((person) => ({
        value: person.id,
        label: person.name,
      })),
    [data],
  );
  const set = (key: FilterParam, value: string | null) =>
    setParams((current) => withParam(current, key, value), { replace: true });
  const filtered = Object.values(FILTER_PARAMS).some((key) => params.has(key));

  return (
    <Flex
      direction="row"
      spacing={1.5}
      flexWrap="wrap"
      useFlexGap
      alignItems="center"
      sx={{ mb: 2 }}
    >
      <DatePicker
        label={t('From')}
        value={paramDay(params.get(FILTER_PARAMS.from))}
        onChange={(day) => set(FILTER_PARAMS.from, dayParam(day))}
        slotProps={{ textField: { size: 'small' } }}
      />
      <DatePicker
        label={t('To')}
        value={paramDay(params.get(FILTER_PARAMS.to))}
        onChange={(day) => set(FILTER_PARAMS.to, dayParam(day))}
        slotProps={{ textField: { size: 'small' } }}
      />
      {scope === 'ALL' && (
        <EmployeeFilter
          label="Organizer"
          options={people}
          value={params.get(FILTER_PARAMS.organizer)}
          onChange={(value) => set(FILTER_PARAMS.organizer, value)}
        />
      )}
      <EmployeeFilter
        label="Participant"
        options={people}
        value={params.get(FILTER_PARAMS.participant)}
        onChange={(value) => set(FILTER_PARAMS.participant, value)}
      />
      <EnumFilter
        label="Status"
        values={Object.values(MaMeetingStatus)}
        value={params.get(FILTER_PARAMS.status)}
        onChange={(value) => set(FILTER_PARAMS.status, value)}
      />
      <EnumFilter
        label="Language"
        values={Object.values(MaLanguage)}
        value={params.get(FILTER_PARAMS.language)}
        onChange={(value) => set(FILTER_PARAMS.language, value)}
      />
      {filtered && (
        <Button
          size="small"
          startIcon={<FilterAltOffIcon />}
          onClick={() => setParams(new URLSearchParams(), { replace: true })}
        >
          {t('Clear filters')}
        </Button>
      )}
    </Flex>
  );
}
