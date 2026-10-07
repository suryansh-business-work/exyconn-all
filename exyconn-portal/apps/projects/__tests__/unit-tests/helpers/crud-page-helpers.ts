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
 * Fires the grid action `key` for `row`, which asks before it acts, checks the confirm
 * dialog says `prompt`, and answers it with the button named `answer`.
 */
export async function answerRowConfirm(
  key: string,
  row: object,
  prompt: string,
  answer: string,
): Promise<void> {
  let pendingAction: unknown;
  act(() => {
    pendingAction = dashboardProps().context.actions[key](row);
  });
  expect(await screen.findByText(prompt)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answer }));
  await act(async () => {
    await pendingAction;
  });
}
