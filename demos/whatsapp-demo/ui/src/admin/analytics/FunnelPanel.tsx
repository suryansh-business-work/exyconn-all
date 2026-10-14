import { useMemo } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  BarChart,
  Box,
  ChartCard,
  Skeleton,
  Typography,
  type ValueFormatter,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useWhatsappDemoFunnelQuery } from '@exyconn/shell/graphql/generated';
import { QueryErrorState } from '../shared/QueryErrorState';
import { funnelChart, type FlowRow } from './analytics.data';

interface FunnelPanelProps {
  flow: FlowRow;
  /** The analysed period, as the stats query got it. */
  range: { from: string; to: string };
}

/** Pixels per funnel step: a horizontal bar per node, so the chart grows with the flow. */
const STEP_HEIGHT = 40;
const MIN_HEIGHT = 160;

/**
 * Where people left one workflow: the distinct sessions reaching each node, in the order they
 * were first reached, with each step's drop-off from the one before.
 */
export function FunnelPanel({ flow, range }: Readonly<FunnelPanelProps>) {
  const t = useT();
  const { formatNumber, formatPercent } = useFormatters();
  const formatCount: ValueFormatter = (value) => formatNumber(value);
  const { data, loading, error, refetch } = useWhatsappDemoFunnelQuery({
    variables: { demoKey: flow.demoKey, workflow: flow.workflow, ...range },
  });

  const steps = data?.whatsappDemoFunnel;
  const chart = useMemo(
    () => funnelChart(steps ?? [], formatPercent, t),
    [steps, formatPercent, t],
  );

  if (error) {
    return <QueryErrorState error={error} title="Could not load the funnel." onRetry={refetch} />;
  }

  return (
    <Box sx={panel}>
      {loading && !steps ? (
        <Box aria-busy>
          <Typography variant="subtitle2" component="h2">
            {t('Funnel: {workflow}', { workflow: flow.name })}
          </Typography>
          <Skeleton variant="rounded" height={MIN_HEIGHT} sx={{ mt: 1.5 }} />
        </Box>
      ) : (
        <ChartCard
          title={t('Funnel: {workflow}', { workflow: flow.name })}
          subtitle={t(
            '{industry} — sessions reaching each step, with the drop-off from the step before',
            {
              industry: flow.industry,
            },
          )}
          data={chart}
          formatValue={formatCount}
          labelHeading={t('Step')}
          emptyText={t('Nobody reached a step of this workflow in this period.')}
        >
          <BarChart
            data={chart}
            formatValue={formatCount}
            horizontal
            integer
            height={Math.max(MIN_HEIGHT, chart.labels.length * STEP_HEIGHT)}
          />
        </ChartCard>
      )}
    </Box>
  );
}
