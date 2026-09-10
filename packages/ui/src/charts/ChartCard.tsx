import type { ReactElement, ReactNode } from 'react';
import { useId, useState } from 'react';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ChartTable } from './ChartTable';
import type { ChartData, ValueFormatter } from './chart.types';

interface Props {
  title: string;
  /** One line saying what the reader is looking at. Carries the units. */
  subtitle?: string;
  data: ChartData;
  formatValue: ValueFormatter;
  /** Column heading for the table twin — "Day", "Hour", "Application". */
  labelHeading: string;
  /** Shown instead of the chart when there is nothing to draw. */
  emptyText?: string;
  children: ReactNode;
}

/** True when every series is empty or all-zero — a chart of nothing is worse than a sentence. */
function isEmpty(data: ChartData): boolean {
  if (data.labels.length === 0 || data.series.length === 0) {
    return true;
  }
  return data.series.every((series) => series.values.every((value) => value === 0));
}

/**
 * The frame every chart here sits in: a title that says what is plotted, and a switch to the
 * same numbers as a table.
 *
 * The table is not an accessibility afterthought bolted on at the end — it is what makes the
 * chart legal. Three of the palette's light-mode slots sit below 3:1 against a white surface,
 * which is only allowed because the values are reachable without seeing the fill at all. It is
 * also the answer to the reader who does not want to hover over sixteen bars to read sixteen
 * numbers.
 */
export function ChartCard({
  title,
  subtitle,
  data,
  formatValue,
  labelHeading,
  emptyText = 'Nothing tracked in this period.',
  children,
}: Readonly<Props>): ReactElement {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const headingId = useId();
  const empty = isEmpty(data);

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 1.5
        }}>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography id={headingId} variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
        {empty ? null : (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            aria-label={`${title} — chart or table`}
            onChange={(_event, next: 'chart' | 'table' | null) => {
              if (next !== null) {
                setView(next);
              }
            }}
          >
            <ToggleButton value="chart" aria-label="Show as a chart" sx={{ px: 1.25 }}>
              Chart
            </ToggleButton>
            <ToggleButton value="table" aria-label="Show the numbers as a table" sx={{ px: 1.25 }}>
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      {empty ? (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            py: 3,
            textAlign: 'center'
          }}>
          {emptyText}
        </Typography>
      ) : (
        <Box aria-labelledby={headingId}>
          {view === 'chart' ? (
            children
          ) : (
            <ChartTable data={data} formatValue={formatValue} labelHeading={labelHeading} />
          )}
        </Box>
      )}
    </Box>
  );
}
