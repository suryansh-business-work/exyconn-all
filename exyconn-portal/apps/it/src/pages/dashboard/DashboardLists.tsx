import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Grid, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { ItDashboardQuery } from '@exyconn/shell/graphql/generated';

type Dashboard = ItDashboardQuery['itDashboard'];

/** One list under the tiles, with a sentence when it is empty rather than a blank. */
function DashboardList({
  title,
  empty,
  children,
}: Readonly<{ title: string; empty: string; children: ReactNode[] }>) {
  const t = useT();
  return (
    <Stack spacing={1}>
      <Text size="sm" weight="medium">
        {t(title)}
      </Text>
      {children.length === 0 ? (
        <Text size="sm" color="text.secondary">
          {t(empty)}
        </Text>
      ) : (
        children
      )}
    </Stack>
  );
}

/** A title, a chip for its state and a date — the shape every dashboard row has. */
function Line({ title, chip, date }: Readonly<{ title: string; chip: string; date: string }>) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Text size="sm" sx={{ flex: 1, minWidth: 0 }}>
        {title}
      </Text>
      <StatusChip value={chip} />
      <Text size="caption" color="text.secondary">
        {date}
      </Text>
    </Stack>
  );
}

/** Live incidents, changes about to happen, and what IT has told everyone. */
export function DashboardLists({ dashboard }: Readonly<{ dashboard: Dashboard }>) {
  const { formatDate, formatDateTime } = useSettings();
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <DashboardList title="Recent incidents" empty="No incidents recorded.">
          {dashboard.recentIncidents.map((incident) => (
            <Line
              key={incident.id}
              title={incident.title}
              chip={incident.status}
              date={formatDateTime(incident.startedAt)}
            />
          ))}
        </DashboardList>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DashboardList title="Upcoming changes" empty="No changes scheduled.">
          {dashboard.upcomingChanges.map((change) => (
            <Line
              key={change.id}
              title={change.title}
              chip={change.risk}
              date={formatDateTime(change.plannedStart)}
            />
          ))}
        </DashboardList>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DashboardList title="Announcements" empty="Nothing announced.">
          {dashboard.announcements.map((announcement) => (
            <Line
              key={announcement.id}
              title={announcement.title}
              chip={announcement.category}
              date={formatDate(announcement.publishedAt)}
            />
          ))}
        </DashboardList>
      </Grid>
    </Grid>
  );
}
