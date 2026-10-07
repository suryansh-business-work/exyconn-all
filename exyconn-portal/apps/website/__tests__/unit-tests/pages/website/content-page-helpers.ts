import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import { dashboardProps } from './content-dashboard-stub';

/** Runs one of the page's grid row actions the way an action cell would, inside act. */
export async function runRowAction(key: string, row: object): Promise<void> {
  await act(async () => {
    await dashboardProps().context.actions[key](row);
  });
}

/**
 * Starts a row action that waits on a confirm dialog, without waiting for it. The test answers
 * the dialog, then calls the returned `settle` to let the action finish inside act.
 */
export function startRowAction(key: string, row: object): () => Promise<void> {
  let running: unknown;
  act(() => {
    running = dashboardProps().context.actions[key](row);
  });
  return () =>
    act(async () => {
      await running;
    });
}

/**
 * Fires the grid's delete action for `row`, checks the confirm dialog asks `prompt`, and
 * confirms it — the full confirm-then-delete flow useCrudResource runs.
 */
export async function confirmRowDelete(row: object, prompt: string): Promise<void> {
  const settle = startRowAction('delete', row);
  expect(await screen.findByText(prompt)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await settle();
}

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

/** A query that has not answered yet. */
export function pendingQuery() {
  return { data: undefined, loading: true, refetch: () => Promise.resolve({}) };
}
