import type { ReactElement } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { ChartData, ValueFormatter } from './chart.types';

interface Props {
  data: ChartData;
  formatValue: ValueFormatter;
  /** What the label column is called — "Day", "Hour", "Application". */
  labelHeading: string;
}

/**
 * The table twin of a chart.
 *
 * Every chart here has one, and it is not a nicety: it is how a value stays readable when the
 * fill colour cannot carry it — a screen reader, a monochrome print, a colour-blind reader, or
 * simply one of the lighter slots on a white surface. A tooltip is an enhancement; it may
 * never be the only way to read a number.
 */
export function ChartTable({ data, formatValue, labelHeading }: Readonly<Props>): ReactElement {
  return (
    <TableContainer sx={{ maxHeight: 320 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>{labelHeading}</TableCell>
            {data.series.map((series) => (
              <TableCell key={series.id} align="right">
                {series.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.labels.map((label, index) => (
            <TableRow key={label} hover>
              <TableCell>{label}</TableCell>
              {data.series.map((series) => (
                <TableCell
                  key={series.id}
                  align="right"
                  // Columns of numbers align on the digit; only columns get tabular figures.
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatValue(series.values[index] ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
