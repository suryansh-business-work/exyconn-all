import { G, Line, Text as SvgText } from 'react-native-svg';
import type { ValueFormatter } from '../../lib/report/charts';
import { labelStep, slotCenters, ticks, type PlotArea } from '../../lib/report/chart-geometry';
import { useThemeColor } from '../../theme/useThemeColor';

interface Props {
  plot: PlotArea;
  /** The value the top gridline stands for. */
  max: number;
  labels: readonly string[];
  formatValue: ValueFormatter;
}

const TICK_STEPS = 2;
/** At most this many day labels under the plot — a phone column has no room for 31. */
const MAX_LABELS = 8;
const FONT_SIZE = 10;

/**
 * Gridlines, value ticks and day labels — drawn inside the chart's <Svg>. The chrome is the
 * theme's hairline and muted ink, so a chart's gridlines match every other divider in the app.
 */
export function ChartAxes({ plot, max, labels, formatValue }: Readonly<Props>) {
  const hairline = useThemeColor('hairline');
  const muted = useThemeColor('muted');
  const baseline = plot.top + plot.height;
  const step = labelStep(labels.length, MAX_LABELS);
  const centers = slotCenters(labels.length, plot);

  return (
    <G>
      {ticks(max, TICK_STEPS).map((value) => {
        const y = baseline - (max > 0 ? (value / max) * plot.height : 0);
        return (
          <G key={value}>
            <Line
              x1={plot.left}
              x2={plot.left + plot.width}
              y1={y}
              y2={y}
              stroke={hairline}
              strokeWidth={1}
            />
            <SvgText
              x={plot.left - 6}
              y={y + FONT_SIZE / 3}
              fontSize={FONT_SIZE}
              fill={muted}
              textAnchor="end"
            >
              {formatValue(value)}
            </SvgText>
          </G>
        );
      })}
      {labels.map((label, index) =>
        index % step === 0 ? (
          <SvgText
            key={label}
            x={centers[index]}
            y={baseline + FONT_SIZE + 4}
            fontSize={FONT_SIZE}
            fill={muted}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ) : null,
      )}
    </G>
  );
}
