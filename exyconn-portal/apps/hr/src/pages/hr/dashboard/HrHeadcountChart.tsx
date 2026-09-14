import { useT } from '@exyconn/i18n';
import { Box, Chip, Flex, Paragraph, Text, color } from '@exyconn/shell/components/ui';
import { LineChart } from '@exyconn/shell/components/dashboard/LineChart';
import { panel } from '@exyconn/shell/components/glass/glass';

/** One month on the headcount line. */
interface HeadcountPoint {
  label: string;
  count: number;
}

interface HrHeadcountChartProps {
  points: readonly HeadcountPoint[];
  /** True while the dashboard query is in flight — "Loading…" rather than "not enough yet". */
  loading: boolean;
}

/**
 * Employees over time. A single month is a dot, not a line, so anything shorter than two
 * points says so instead of drawing a chart that cannot show a trend.
 */
export function HrHeadcountChart({ points, loading }: Readonly<HrHeadcountChartProps>) {
  const t = useT();
  const empty = loading ? t('Loading…') : t('Not enough history to chart yet.');

  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Text size="label">{t('Employee count over time')}</Text>
        <Chip
          label={t('{count} months', { count: points.length })}
          size="small"
          variant="outlined"
        />
      </Flex>
      {points.length > 1 ? (
        <LineChart
          labels={points.map((p) => p.label)}
          data={points.map((p) => p.count)}
          color={color.blue[600]}
        />
      ) : (
        <Paragraph color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {empty}
        </Paragraph>
      )}
    </Box>
  );
}
