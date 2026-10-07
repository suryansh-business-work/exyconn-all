import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { crudProps } from './cms-dashboard-stub';

/** Runs one of the page's grid row actions the way an action cell would, inside act. */
export async function runRowAction(key: string, row: object): Promise<void> {
  await act(async () => {
    await crudProps().context.actions[key](row as never);
  });
}

/**
 * Fires the grid's delete action for `row`, checks the confirm dialog asks `prompt`, and
 * confirms it — the full confirm-then-delete flow useCrudResource runs.
 */
export async function confirmRowDelete(row: object, prompt: string): Promise<void> {
  let removal: unknown;
  act(() => {
    removal = crudProps().context.actions.delete(row as never);
  });
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText(prompt)).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
  await act(async () => {
    await removal;
  });
}
