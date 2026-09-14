import { useState, type ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { isChartEmpty, type ChartData, type ValueFormatter } from '../../lib/report/charts';
import { Surface } from '../ui/Surface';
import { Body, Caption, Heading } from '../ui/Typography';
import { ChartTable } from './ChartTable';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

type ChartView = 'chart' | 'table';

const VIEWS: readonly SegmentOption<ChartView>[] = [
  { value: 'chart', label: 'Chart', accessibilityLabel: 'Show as a chart' },
  { value: 'table', label: 'Table', accessibilityLabel: 'Show the numbers as a table' },
];

interface Props {
  title: string;
  /** One line saying what the reader is looking at. Carries the units. */
  subtitle: string;
  data: ChartData;
  formatValue: ValueFormatter;
  /** Column heading for the table twin — "Day". */
  labelHeading: string;
  /** Shown instead of the chart when there is nothing to draw. */
  emptyText: string;
  children: ReactNode;
}

/**
 * The frame every chart here sits in: a title that says what is plotted, and a switch to the
 * same numbers as a table — the desktop's ChartCard. The table is what makes the chart legal:
 * the values are always reachable without seeing a fill at all.
 */
export function ChartCard({
  title,
  subtitle,
  data,
  formatValue,
  labelHeading,
  emptyText,
  children,
}: Readonly<Props>) {
  const t = useT();
  const [view, setView] = useState<ChartView>('chart');
  const empty = isChartEmpty(data);
  const views = VIEWS.map((option) => ({
    ...option,
    label: t(option.label),
    accessibilityLabel: t(option.accessibilityLabel ?? option.label),
  }));

  let body: ReactNode = children;
  if (empty) {
    body = (
      <Body color="$muted" textAlign="center" paddingVertical="$4">
        {emptyText}
      </Body>
    );
  } else if (view === 'table') {
    body = <ChartTable data={data} formatValue={formatValue} labelHeading={labelHeading} />;
  }

  return (
    <Surface>
      <XStack gap="$2" alignItems="flex-start" justifyContent="space-between">
        <YStack flex={1} gap="$1">
          <Heading size="$4">{title}</Heading>
          <Caption>{subtitle}</Caption>
        </YStack>
        {empty ? null : (
          <SegmentedControl
            options={views}
            value={view}
            onChange={setView}
            label={t('{title} — chart or table', { title })}
          />
        )}
      </XStack>
      {body}
    </Surface>
  );
}
