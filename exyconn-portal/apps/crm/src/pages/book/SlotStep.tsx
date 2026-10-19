import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { useT } from '@exyconn/i18n';
import {
  AdapterDateFns,
  Alert,
  alpha,
  Box,
  DateCalendar,
  LocalizationProvider,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { usePublicMeetingSlotsQuery } from '@exyconn/shell/graphql/generated';
import { TimeColumn } from './TimeColumn';
import { TimezoneSelect } from './TimezoneSelect';
import { useBookingTime } from './useBookingTime';
import { SlotsLoading } from './SlotsLoading';
import type { BookingAddress } from './useBookingAddress';

const renderSlotsLoading = () => <SlotsLoading />;

/** A day the calendar shows, as the same sortable key the free times are grouped by. */
const calendarKey = (date: Date) => format(date, 'yyyy-MM-dd');

interface SlotStepProps {
  at: BookingAddress;
  slug: string;
  zone: string;
  onZone: (zone: string) => void;
  onPick: (slot: string) => void;
}

/**
 * "Select a Date & Time": a month calendar (the week starting Monday) where days with free
 * times stand out, the time zone, and the picked day's free times.
 */
export function SlotStep({ at, slug, zone, onZone, onPick }: Readonly<SlotStepProps>) {
  const t = useT();
  const when = useBookingTime(zone);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { data, loading, error } = usePublicMeetingSlotsQuery({
    variables: { ...at, slug, from: month.toISOString(), to: endOfMonth(month).toISOString() },
    fetchPolicy: 'network-only',
  });
  const byDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const slot of data?.publicMeetingSlots ?? []) {
      const key = when.dayKey(slot);
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return map;
  }, [data, when]);

  return (
    <Stack spacing={2}>
      <Text component="h2" size="lg" weight="bold">
        {t('Select a Date & Time')}
      </Text>
      {error && (
        <Alert severity="error">{errorMessage(error, t('Could not load the free times.'))}</Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: day ? 'minmax(0, 1fr) 240px' : '1fr' },
        }}
      >
        <Stack spacing={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
            <DateCalendar
              value={day}
              onChange={(value: Date | null) => {
                setDay(value);
                setSelected(null);
              }}
              onMonthChange={(value: Date) => {
                setMonth(startOfMonth(value));
                setDay(null);
              }}
              minDate={startOfMonth(new Date())}
              maxDate={addMonths(new Date(), 12)}
              loading={loading}
              renderLoading={renderSlotsLoading}
              shouldDisableDate={(date: Date) => !byDay.has(calendarKey(date))}
              sx={{
                m: 0,
                '& [role="gridcell"]:not(.Mui-disabled):not(.Mui-selected)': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 'bold',
                },
              }}
            />
          </LocalizationProvider>
          <TimezoneSelect value={zone} onChange={onZone} />
        </Stack>
        {day && (
          <TimeColumn
            title={when.dayTitle(day)}
            slots={byDay.get(calendarKey(day)) ?? []}
            selected={selected}
            label={when.time}
            onSelect={setSelected}
            onNext={onPick}
          />
        )}
      </Box>
    </Stack>
  );
}
