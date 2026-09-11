import Svg, { Circle, Path } from 'react-native-svg';
import { YStack } from 'tamagui';
import { useMeasuredWidth } from '../../hooks/useMeasuredWidth';
import type { ChartSeries, ValueFormatter } from '../../lib/report/charts';
import { areaPath, linePath, linePoints, plotArea } from '../../lib/report/chart-geometry';
import { ChartAxes } from './ChartAxes';

interface Props {
  labels: readonly string[];
  /** One line, in its own `color`. */
  series: ChartSeries;
  /** The axis ceiling — 100 for a percentage, which has a natural top. */
  max: number;
  formatValue: ValueFormatter;
  height: number;
  /** The whole chart, said in one sentence — it is one image to a screen reader. */
  accessibilityLabel: string;
}

const AREA_OPACITY = 0.15;
const DOT_RADIUS = 2.5;

/**
 * A line over a soft area — for a question about the SHAPE of a run of days, not the size of
 * any one of them. Each day is also a dot, so a lone day in an empty month is still visible.
 */
export function TrendLineChart({
  labels,
  series,
  max,
  formatValue,
  height,
  accessibilityLabel,
}: Readonly<Props>) {
  const [width, onLayout] = useMeasuredWidth();
  const plot = plotArea(width, height);
  const points = linePoints(series.values, max, plot);

  return (
    <YStack
      height={height}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <ChartAxes plot={plot} max={max} labels={labels} formatValue={formatValue} />
          <Path
            d={areaPath(points, plot.top + plot.height)}
            fill={series.color}
            fillOpacity={AREA_OPACITY}
          />
          <Path d={linePath(points)} stroke={series.color} strokeWidth={2} fill="none" />
          {points.map((point, index) => (
            <Circle
              key={labels[index]}
              cx={point.x}
              cy={point.y}
              r={DOT_RADIUS}
              fill={series.color}
            />
          ))}
        </Svg>
      ) : null}
    </YStack>
  );
}
