import { XStack, YStack } from 'tamagui';
import type { ChartData, ValueFormatter } from '../../lib/report/charts';
import { borderWidth } from '../../theme/tokens';
import { Body, Caption } from '../ui/Typography';

interface Props {
  data: ChartData;
  formatValue: ValueFormatter;
  /** What the label column is called — "Day". */
  labelHeading: string;
}

interface RowProps {
  label: string;
  cells: readonly { id: string; text: string }[];
  heading?: boolean;
}

function TableRow({ label, cells, heading = false }: Readonly<RowProps>) {
  const Cell = heading ? Caption : Body;
  return (
    <XStack
      paddingVertical="$2"
      borderBottomWidth={borderWidth.hairline}
      borderBottomColor="$hairline"
      accessible
      accessibilityLabel={[label, ...cells.map((cell) => cell.text)].join(', ')}
    >
      <Cell flex={1} fontWeight={heading ? '700' : '400'}>
        {label}
      </Cell>
      {cells.map((cell) => (
        <Cell
          key={cell.id}
          flex={1}
          textAlign="right"
          fontWeight={heading ? '700' : '400'}
          fontVariant={['tabular-nums']}
        >
          {cell.text}
        </Cell>
      ))}
    </XStack>
  );
}

/**
 * The table twin of a chart.
 *
 * Every chart here has one, and it is not a nicety: it is how a value stays readable when the
 * fill colour cannot carry it — a screen reader, a colour-blind reader, or simply a small bar
 * on a small screen. There are no tooltips on a phone, so this IS how a single day is read.
 */
export function ChartTable({ data, formatValue, labelHeading }: Readonly<Props>) {
  return (
    <YStack>
      <TableRow
        heading
        label={labelHeading}
        cells={data.series.map((series) => ({ id: series.id, text: series.label }))}
      />
      {data.labels.map((label, index) => (
        <TableRow
          key={label}
          label={label}
          cells={data.series.map((series) => ({
            id: series.id,
            text: formatValue(series.values[index] ?? 0),
          }))}
        />
      ))}
    </YStack>
  );
}
