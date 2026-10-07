import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { dashboardProps } from './crud-dashboard-stub';

/** The stat tiles the dashboard stand-in lists, as "label: value" lines. */
export function statLines(): string[] {
  return screen.getAllByRole('listitem').map((item) => item.textContent ?? '');
}

/** Runs one of the page's grid row actions the way an action cell would, inside act. */
export async function runRowAction(key: string, row: object): Promise<void> {
  await act(async () => {
    await dashboardProps().context.actions[key](row);
  });
}

/**
 * Fires the grid's delete action for `row`, checks the confirm dialog asks `prompt`, and
 * confirms it — the full confirm-then-delete flow useCrudResource runs.
 */
export async function confirmRowDelete(row: object, prompt: string): Promise<void> {
  let removal: unknown;
  act(() => {
    removal = dashboardProps().context.actions.delete(row);
  });
  expect(await screen.findByText(prompt)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await act(async () => {
    await removal;
  });
}
