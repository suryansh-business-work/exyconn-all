import { parseISO } from 'date-fns';
import type { Interpolations } from '@exyconn/i18n';
import type { ChartData } from '@exyconn/shell/components/ui';
import type {
  WhatsappDemoFunnelQuery,
  WhatsappDemoStatsQuery,
} from '@exyconn/shell/graphql/generated';

export type DemoStats = WhatsappDemoStatsQuery['whatsappDemoStats'];
type Counts = DemoStats['devices'];
type Translate = (source: string, values?: Interpolations) => string;
type FormatDay = (value: Date) => string;

/** One row of the flow breakdown: a workflow of one industry over the period. */
export interface FlowRow {
  id: string;
  demoKey: string;
  workflow: string;
  industry: string;
  name: string;
  started: number;
  completed: number;
  abandoned: number;
  /** 0-100. */
  completionPct: number;
}

/** A share as a whole 0-100 percentage; nothing out of nothing is 0, not NaN. */
export function percentOf(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** Sessions and flows per day — the period's activity line. */
export function dailyChart(
  daily: DemoStats['daily'],
  formatDay: FormatDay,
  t: Translate,
): ChartData {
  return {
    labels: daily.map((point) => formatDay(parseISO(point.date))),
    series: [
      { id: 'sessions', label: t('Sessions'), values: daily.map((point) => point.sessions) },
      {
        id: 'flowsStarted',
        label: t('Flows started'),
        values: daily.map((point) => point.flowsStarted),
      },
      {
        id: 'flowsCompleted',
        label: t('Flows completed'),
        values: daily.map((point) => point.flowsCompleted),
      },
    ],
  };
}

/** A single-series count chart (industries opened, devices used). */
export function countChart(counts: Counts, seriesLabel: string): ChartData {
  return {
    labels: counts.map((count) => count.label),
    series: [{ id: 'count', label: seriesLabel, values: counts.map((count) => count.count) }],
  };
}

/** The flow breakdown, most-started first, with the industry each demo key stands for. */
export function flowRows(
  flows: DemoStats['flows'],
  industryName: (key: string) => string,
): FlowRow[] {
  return [...flows]
    .sort((a, b) => b.started - a.started)
    .map((flow) => ({
      id: `${flow.demoKey}:${flow.workflow}`,
      demoKey: flow.demoKey,
      workflow: flow.workflow,
      industry: industryName(flow.demoKey),
      name: flow.name,
      started: flow.started,
      completed: flow.completed,
      abandoned: flow.abandoned,
      completionPct: percentOf(flow.completed, flow.started),
    }));
}

type FunnelSteps = WhatsappDemoFunnelQuery['whatsappDemoFunnel'];

/**
 * The funnel as a horizontal bar chart. The drop-off from the previous step is written into
 * each step's label, so it reads the same in the chart and in its table twin; the step number
 * keeps labels unique when two nodes share a title.
 */
export function funnelChart(
  steps: FunnelSteps,
  formatPct: (value: number) => string,
  t: Translate,
): ChartData {
  const labels = steps.map((step, index) => {
    const position = index + 1;
    const previous = steps[index - 1];
    if (!previous) {
      return t('{position}. {label}', { position, label: step.label });
    }
    const dropOff = 100 - percentOf(step.sessions, previous.sessions);
    return t('{position}. {label} ({drop} drop-off)', {
      position,
      label: step.label,
      drop: formatPct(Math.max(0, dropOff)),
    });
  });
  return {
    labels,
    series: [
      {
        id: 'sessions',
        label: t('Sessions reaching the step'),
        values: steps.map((s) => s.sessions),
      },
    ],
  };
}
