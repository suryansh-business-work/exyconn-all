import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, MenuItem, Stack, TextField } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useMeetingTrackingQuery, useMeetingTypesQuery } from '@exyconn/shell/graphql/generated';
import { conversion, TrackingTables } from './TrackingTables';

const PERIODS = [7, 30, 90, 365] as const;

/**
 * Meetings > Tracking: how many opened the booking links, how many booked, from which country
 * and when. GDPR by design — the server keeps no IP address, cookie or name, only the country
 * the visitor's time zone names, and forgets every visit after about 13 months.
 */
export function TrackingPanel() {
  const t = useT();
  const [days, setDays] = useState<number>(30);
  const { data, loading, error } = useMeetingTrackingQuery({ variables: { days } });
  const types = useMeetingTypesQuery();
  const titles = useMemo(
    () => new Map((types.data?.meetingTypes ?? []).map((type) => [type.slug, type.title])),
    [types.data],
  );
  const tracking = data?.meetingTracking;
  const views = tracking?.views ?? 0;
  const bookings = tracking?.bookings ?? 0;
  const stats = [
    {
      label: 'Link views',
      value: String(views),
      series: tracking?.byDay.map((day) => day.views),
    },
    {
      label: 'Bookings',
      value: String(bookings),
      series: tracking?.byDay.map((day) => day.bookings),
    },
    { label: 'Booked after viewing', value: conversion(views, bookings) },
    { label: 'Countries', value: String(tracking?.byCountry.length ?? 0) },
  ];

  return (
    <Box>
      <PageHeader
        title="Tracking"
        subtitle="Who opened your booking links and who booked — no cookies or personal data kept"
      />
      <Stack spacing={3}>
        <TextField
          select
          size="small"
          label={t('Period')}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          sx={{ maxWidth: 220 }}
        >
          {PERIODS.map((period) => (
            <MenuItem key={period} value={period}>
              {t('Last {days} days', { days: period })}
            </MenuItem>
          ))}
        </TextField>
        {error && (
          <Alert severity="error">{errorMessage(error, t('Could not load the tracking.'))}</Alert>
        )}
        <StatRow stats={stats} loading={loading && !tracking} />
        <TrackingTables tracking={tracking} titles={titles} loading={loading && !tracking} />
        <Alert severity="info">
          {t(
            'Counted without cookies, IP addresses or names. The country comes from the visitor’s time zone, and visits are deleted after 13 months.',
          )}
        </Alert>
      </Stack>
    </Box>
  );
}
