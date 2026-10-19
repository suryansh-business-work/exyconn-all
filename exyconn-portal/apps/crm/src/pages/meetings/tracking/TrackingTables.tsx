import { useFormatters, useT } from '@exyconn/i18n';
import { Grid, Stack, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { MeetingTrackingQuery } from '@exyconn/shell/graphql/generated';

type Tracking = MeetingTrackingQuery['meetingTracking'];

interface Counted {
  id: string;
  label: string;
  views: number;
  bookings: number;
}

/** "25%" of views that ended in a booking; "–" when nobody looked. */
export const conversion = (views: number, bookings: number) =>
  views > 0 ? `${Math.round((bookings / views) * 100)}%` : '–';

function CountTable({
  title,
  label,
  rows,
  loading,
}: Readonly<{ title: string; label: string; rows: Counted[]; loading: boolean }>) {
  const t = useT();
  const columns: Column<Counted>[] = [
    { key: 'label', label },
    { key: 'views', label: 'Views' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'conversion', label: 'Booked', render: (r) => conversion(r.views, r.bookings) },
  ];
  return (
    <Stack spacing={1}>
      <Text component="h3" weight="bold">
        {t(title)}
      </Text>
      <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="No visits yet." />
    </Stack>
  );
}

interface TrackingTablesProps {
  tracking?: Tracking;
  /** Meeting titles by link part; the booking page itself is ''. */
  titles: ReadonlyMap<string, string>;
  loading: boolean;
}

/** Views and bookings by country and by meeting, then the latest visits one by one. */
export function TrackingTables({ tracking, titles, loading }: Readonly<TrackingTablesProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const meetingName = (slug: string) => (slug ? (titles.get(slug) ?? slug) : t('Booking page'));
  const unknown = t('Unknown');
  const byCountry = (tracking?.byCountry ?? []).map((row) => ({
    id: row.country || 'unknown',
    label: row.countryName || unknown,
    views: row.views,
    bookings: row.bookings,
  }));
  const byMeeting = (tracking?.byMeeting ?? []).map((row) => ({
    id: row.meetingSlug || 'page',
    label: meetingName(row.meetingSlug),
    views: row.views,
    bookings: row.bookings,
  }));
  type Visit = Tracking['recent'][number];
  const recentColumns: Column<Visit>[] = [
    { key: 'at', label: 'When', render: (r) => formatDateTime(r.at) },
    { key: 'kind', label: 'What', render: (r) => <StatusChip value={r.kind} /> },
    { key: 'meetingSlug', label: 'Page', render: (r) => meetingName(r.meetingSlug) },
    { key: 'country', label: 'Country', render: (r) => r.countryName || unknown },
  ];
  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <CountTable title="By country" label="Country" rows={byCountry} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CountTable title="By meeting" label="Page" rows={byMeeting} loading={loading} />
        </Grid>
      </Grid>
      <Stack spacing={1}>
        <Text component="h3" weight="bold">
          {t('Latest visits')}
        </Text>
        <DataTable
          columns={recentColumns}
          rows={tracking?.recent ?? []}
          loading={loading}
          emptyMessage="No visits yet."
        />
      </Stack>
    </Stack>
  );
}
