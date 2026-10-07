import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { dashboardProps } from './crud-dashboard.stub';

/** The stat tiles the dashboard stand-in lists, as "label: value" lines. */
export function statLines(): string[] {
  const list = screen.getByRole('list', { name: 'stats' });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

/** Runs one of the page's grid row actions the way an action cell would, inside act. */
export async function runRowAction(key: string, row: object): Promise<void> {
  await act(async () => {
    await dashboardProps().context.actions[key](row);
  });
}

/**
 * Starts a grid row action that opens a confirm dialog, checks the dialog asks `prompt`, then
 * presses `answer` in it and waits for the action to settle.
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
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: answer }));
  await act(async () => {
    await pendingAction;
  });
}
