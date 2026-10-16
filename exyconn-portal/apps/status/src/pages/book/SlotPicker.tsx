import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, startOfMonth } from 'date-fns';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  DateCalendar,
  Flex,
  Skeleton,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { usePublicMeetingSlotsQuery } from '@exyconn/shell/graphql/generated';
import { useVisitorTime } from './useVisitorTime';

/** A month of free times: days with none are greyed out; picking a day lists its times. */
export function SlotPicker({
  slug,
  onPick,
}: Readonly<{ slug: string; onPick: (startAt: string) => void }>) {
  const t = useT();
  const when = useVisitorTime();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<Date | null>(null);
  const { data, loading, error } = usePublicMeetingSlotsQuery({
    variables: { slug, from: month.toISOString(), to: endOfMonth(month).toISOString() },
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
  const chosen = day ? (byDay.get(when.dayKey(day)) ?? []) : [];

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error">{errorMessage(error, t('Could not load the free times.'))}</Alert>
      )}
      <DateCalendar
        value={day}
        onChange={(value: Date | null) => setDay(value)}
        onMonthChange={(value: Date) => {
          setMonth(startOfMonth(value));
          setDay(null);
        }}
        minDate={startOfMonth(new Date())}
        maxDate={addMonths(new Date(), 12)}
        loading={loading}
        shouldDisableDate={(date: Date) => !byDay.has(when.dayKey(date))}
      />
      <Typography variant="subtitle2">
        {t('Times are in your time zone, {zone}.', { zone: when.zone })}
      </Typography>
      {loading && !data && <Skeleton variant="rounded" height={80} aria-busy />}
      {day && chosen.length === 0 && !loading && (
        <Typography color="text.secondary">{t('No free times that day.')}</Typography>
      )}
      <Flex
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        role="list"
        aria-label={t('Free times')}
      >
        {chosen.map((slot) => (
          <Button key={slot} variant="outlined" onClick={() => onPick(slot)}>
            {when.time(slot)}
          </Button>
        ))}
      </Flex>
    </Stack>
  );
}
