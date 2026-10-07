import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { dashboardProps } from './crud-dashboard-stub';

/** The stat tiles the dashboard stand-in lists, as "label: value" lines. */
export function statLines(): string[] {
  const list = screen.getByRole('list', { name: 'stats' });
  return Array.from(list.querySelectorAll('li')).map((item) => item.textContent ?? '');
}

/** Runs one of the page's grid row actions the way an action cell would, inside act. */
export async function runRowAction(key: string, row: object): Promise<void> {
  await act(async () => {
    await dashboardProps().context.actions[key](row as never);
  });
}

/**
 * Starts a row action that asks for confirmation, checks the dialog asks `prompt`, then
 * presses `answer` and waits for the action to finish.
 */
export async function answerRowAction(
  key: string,
  row: object,
  prompt: string,
  answer: string,
): Promise<void> {
  let running: unknown;
  act(() => {
    running = dashboardProps().context.actions[key](row as never);
  });
  expect(await screen.findByText(prompt)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answer }));
  await act(async () => {
    await running;
  });
}

/** Fires the grid's delete action for `row`, checks the prompt and confirms it. */
export function confirmRowDelete(row: object, prompt: string): Promise<void> {
  return answerRowAction('delete', row, prompt, 'Delete');
}
