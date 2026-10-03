import { useT } from '@exyconn/i18n';
import { Grid } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { RatingChip, SonarMetricTile } from './SonarMetricTile';
import type { SonarMetricsData } from './sonar.types';

const MINUTES_PER_HOUR = 60;

/** Whether the server computed this measure. */
const isKnown = (value?: number | null): value is number => value !== null && value !== undefined;

/** One figure as the settings format it; a dash when the server did not compute it. */
function useFigure() {
  const { formatNumber, formatPercent } = useSettings();
  return {
    count: (value?: number | null) => (isKnown(value) ? formatNumber(value) : '—'),
    percent: (value?: number | null) =>
      isKnown(value) ? formatPercent(value, { maximumFractionDigits: 1 }) : '—',
  };
}

/** The project's measures as tiles: issue counts with their ratings, coverage, duplication, size. */
export function SonarMetricGrid({ metrics }: Readonly<{ metrics: SonarMetricsData }>) {
  const t = useT();
  const figure = useFigure();
  const added = (value?: number | null) =>
    isKnown(value) ? t('{count} on new code', { count: figure.count(value) }) : undefined;
  const debtHours = isKnown(metrics.technicalDebtMinutes)
    ? t('{hours} h of technical debt', {
        hours: figure.count(Math.round(metrics.technicalDebtMinutes / MINUTES_PER_HOUR)),
      })
    : undefined;
  const newCoverage = isKnown(metrics.newCoverage)
    ? t('{value} on new code', { value: figure.percent(metrics.newCoverage) })
    : undefined;

  const tiles = [
    {
      label: 'Bugs',
      value: figure.count(metrics.bugs),
      badge: <RatingChip rating={metrics.reliabilityRating} label="Reliability" />,
      note: added(metrics.newBugs),
    },
    {
      label: 'Vulnerabilities',
      value: figure.count(metrics.vulnerabilities),
      badge: <RatingChip rating={metrics.securityRating} label="Security" />,
      note: added(metrics.newVulnerabilities),
    },
    {
      label: 'Security hotspots',
      value: figure.count(metrics.securityHotspots),
      note: added(metrics.newSecurityHotspots),
    },
    {
      label: 'Code smells',
      value: figure.count(metrics.codeSmells),
      badge: <RatingChip rating={metrics.maintainabilityRating} label="Maintainability" />,
      note: debtHours,
    },
    {
      label: 'Coverage',
      value: figure.percent(metrics.coverage),
      percent: metrics.coverage,
      note: newCoverage,
    },
    {
      label: 'Duplications',
      value: figure.percent(metrics.duplicatedLinesDensity),
      percent: metrics.duplicatedLinesDensity,
    },
    { label: 'Lines of code', value: figure.count(metrics.ncloc) },
  ];

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {tiles.map((tile) => (
        <Grid key={tile.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <SonarMetricTile {...tile} />
        </Grid>
      ))}
    </Grid>
  );
}
