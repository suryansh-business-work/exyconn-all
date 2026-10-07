import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';

/** Types a whole value into the text field labelled `label`, as a paste would. */
export function fill(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Waits for a select's menu to finish closing, so the next select opens the only listbox. */
async function menuClosed(): Promise<void> {
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** Opens the select labelled `label` and picks the option with the visible text `option`. */
export async function chooseOption(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await menuClosed();
}

/** Picks options in the multi-select labelled `label`, then closes its menu. */
export async function chooseMany(label: string, options: readonly string[]): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  for (const option of options) {
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: option }),
    );
  }
  await userEvent.keyboard('{Escape}');
  await menuClosed();
}

/** The option labels the select labelled `label` currently offers; closes the list again. */
export async function optionsOf(label: string): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  const labels = within(screen.getByRole('listbox'))
    .queryAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  await menuClosed();
  return labels;
}

/** Clicks a button by its accessible name. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
