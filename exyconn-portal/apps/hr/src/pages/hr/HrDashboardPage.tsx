import { Box, Grid } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useHrDashboardData } from './dashboard/useHrDashboardData';
import { HrPendingLeave } from './dashboard/HrPendingLeave';
import { HrUpcomingHolidays } from './dashboard/HrUpcomingHolidays';
import { HrNewJoiners } from './dashboard/HrNewJoiners';
import { HrAnnouncements } from './dashboard/HrAnnouncements';
import { HrAnniversaries } from './dashboard/HrAnniversaries';
import { HrBirthdays } from './dashboard/HrBirthdays';
import { HrProbations } from './dashboard/HrProbations';
import { HrHeadcountChart } from './dashboard/HrHeadcountChart';

/** HR Dashboard — the morning view: workforce, today, and everything waiting on HR. */
export function HrDashboardPage() {
  const { tiles, derived, headcount, headcountLoading, probationRows, announcementRows, loading } =
    useHrDashboardData();
  const { formatDate } = useSettings();

  return (
    <Box>
      <PageHeader title="HR Dashboard" subtitle="Workforce, today, and what is waiting on you" />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {tiles.map((tile) => (
          <Grid
            key={tile.label}
            size={{
              xs: 6,
              sm: 4,
              md: 3,
              lg: 2,
            }}
          >
            <StatCard {...tile} loading={loading.tiles} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <HrPendingLeave
            rows={derived.pending.slice(0, 6)}
            formatDate={formatDate}
            loading={loading.pendingLeave}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <HrNewJoiners
            users={derived.joiners.slice(0, 6)}
            formatDate={formatDate}
            loading={loading.users}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <HrUpcomingHolidays
            holidays={derived.nextHolidays}
            formatDate={formatDate}
            loading={loading.holidays}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <HrProbations
            rows={probationRows.slice(0, 6)}
            formatDate={formatDate}
            loading={loading.probations}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <HrHeadcountChart points={headcount} loading={headcountLoading} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={12}>
              <HrAnnouncements
                rows={announcementRows.slice(0, 4)}
                formatDate={formatDate}
                loading={loading.announcements}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 12,
              }}
            >
              <HrAnniversaries
                anniversaries={derived.anniversaries.slice(0, 4)}
                formatDate={(d) => formatDate(d.toISOString())}
                loading={loading.users}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 12,
              }}
            >
              <HrBirthdays
                birthdays={derived.birthdays.slice(0, 4)}
                formatDate={(d) => formatDate(d.toISOString())}
                loading={loading.users}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
