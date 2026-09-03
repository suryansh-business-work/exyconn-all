import { Grid } from '@exyconn/shell/components/ui';
import { StatCard, type StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { StatusOverview } from './status.types';

interface StatusStatsProps {
  overview: StatusOverview;
}

/** A percentage to one decimal — or an em dash when nothing has been measured yet. */
const percent = (value: number, measured: boolean) => (measured ? `${value.toFixed(1)}%` : '—');

/** The four numbers that answer "is it healthy, and how fast", with today's trend. */
export function StatusStats({ overview }: Readonly<StatusStatsProps>) {
  const measured = overview.daily.filter((day) => day.checks > 0);
  const uptimeSeries = measured.map((day) => day.uptimePercent);
  const responseSeries = measured.map((day) => day.avgResponseMs);

  const checkedToday = (overview.daily.at(-1)?.checks ?? 0) > 0;

  const stats: StatItem[] = [
    {
      label: 'Services monitored',
      value: String(overview.total),
      accent: '#4f8cff',
    },
    {
      label: 'Uptime today',
      value: percent(overview.uptimeToday, checkedToday),
      accent: '#7be37b',
      series: uptimeSeries,
    },
    {
      label: 'Uptime (30 days)',
      value: percent(overview.uptime30d, measured.length > 0),
      accent: '#7be37b',
    },
    {
      label: 'Average response',
      value: checkedToday ? `${overview.avgResponseMs} ms` : '—',
      accent: '#f9851f',
      series: responseSeries,
    },
  ];

  return (
    <Grid container spacing={1.5}>
      {stats.map((stat) => (
        <Grid key={stat.label} item xs={6} md={3}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
}
