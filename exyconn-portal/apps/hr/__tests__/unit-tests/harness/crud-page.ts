import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import { STAT_SEPARATOR, dashboardProps } from './crud-dashboard';

/**
 * A `listXxxStats` result: `counts` is field -> value -> count, the same shape the server's
 * one aggregation answers with.
 */
export function tableStats(
  total: number,
  counts: Record<string, Record<string, number>> = {},
): TableStatsShape {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: [],
  };
}

/** The stat tiles the dashboard stand-in prints, as "label: value" lines. */
export function statLines(): string[] {
  const line = screen.getByLabelText('stats').textContent ?? '';
  return line.split(STAT_SEPARATOR);
}

/** Runs one of the page's grid row actions the way an action cell would, inside act. */
export async function runRowAction(key: string, row: object): Promise<void> {
  await act(async () => {
    await dashboardProps().context.actions[key](row);
  });
}

/**
 * Fires the grid's delete action for `row`, checks the confirm dialog asks `prompt`, and
 * answers it with `answer` — the confirm-then-delete flow useCrudResource runs.
 */
export async function answerRowDelete(
  row: object,
  prompt: string,
  answer: 'Delete' | 'Cancel' = 'Delete',
): Promise<void> {
  let removal: unknown;
  act(() => {
    removal = dashboardProps().context.actions.delete(row);
  });
  expect(await screen.findByText(prompt)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answer }));
  await act(async () => {
    await removal;
  });
}
