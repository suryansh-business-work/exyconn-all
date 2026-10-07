import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';

/** Types into the text field labelled `label`, replacing what was there. */
export async function fillField(label: string, text: string): Promise<void> {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, text);
}

/** Sets a number field the way a browser reports it: the raw text of the input. */
export function setNumber(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Opens the select labelled `label` and picks the option with the visible text `option`. */
export async function chooseOption(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await menuClosed();
}

/** Waits for a select's menu to finish closing, so the next select opens the only listbox. */
async function menuClosed(): Promise<void> {
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** The option labels the select labelled `label` currently offers; closes the list again. */
export async function optionsOf(label: string): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  const listbox = screen.getByRole('listbox');
  const labels = within(listbox)
    .queryAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  await menuClosed();
  return labels;
}

/** Clicks the form's submit (or any) button by its accessible name. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
