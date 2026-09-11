import Svg, { G, Rect } from 'react-native-svg';
import { YStack } from 'tamagui';
import { useMeasuredWidth } from '../../hooks/useMeasuredWidth';
import type { ChartData, ValueFormatter } from '../../lib/report/charts';
import { niceCeiling, plotArea, stackedColumns, stackedMax } from '../../lib/report/chart-geometry';
import { ChartAxes } from './ChartAxes';
import { ChartLegend } from './ChartLegend';

interface Props {
  /** Every series carries its own `color` — worked and idle MEAN something, so they own theirs. */
  data: ChartData;
  formatValue: ValueFormatter;
  height: number;
  /** The whole chart, said in one sentence — it is one image to a screen reader. */
  accessibilityLabel: string;
}

/**
 * One column per label, the series stacked bottom-up — the part-to-whole reading. The 2px gaps
 * between stacked segments are the surface showing through, not borders drawn around each one.
 */
export function StackedBarChart({
  data,
  formatValue,
  height,
  accessibilityLabel,
}: Readonly<Props>) {
  const [width, onLayout] = useMeasuredWidth();
  const max = niceCeiling(stackedMax(data));
  const plot = plotArea(width, height);
  const columns = stackedColumns(data, max, plot);
  const colorOf = new Map(data.series.map((series) => [series.id, series.color]));

  return (
    <YStack gap="$2">
      <YStack
        height={height}
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        {width > 0 ? (
          <Svg width={width} height={height}>
            <ChartAxes plot={plot} max={max} labels={data.labels} formatValue={formatValue} />
            {columns.map((column) => (
              <G key={column.key}>
                {column.segments.map((segment) => (
                  <Rect
                    key={segment.seriesId}
                    x={column.x}
                    y={segment.y}
                    width={column.width}
                    height={segment.height}
                    fill={colorOf.get(segment.seriesId)}
                  />
                ))}
              </G>
            ))}
          </Svg>
        ) : null}
      </YStack>
      <ChartLegend series={data.series} />
    </YStack>
  );
}
