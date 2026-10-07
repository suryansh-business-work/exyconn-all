import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** The people every employee picker in these tests offers. */
export const USERS = [
  { id: 'user-1', name: 'Asha Rao', email: 'asha@example.com' },
  { id: 'user-2', name: 'Bo Chen', email: 'bo@example.com' },
];

/** Local midnight as the ISO string a date picker stores. */
export function localIso(year: number, monthIndex: number, day: number): string {
  return new Date(year, monthIndex, day).toISOString();
}

/** Types into the text field labelled `label`, replacing what was there. */
export async function typeInto(label: string, text: string): Promise<void> {
  const field = screen.getByRole('textbox', { name: label });
  await userEvent.clear(field);
  await userEvent.type(field, text);
}

/** Sets a number field the way a browser reports it: the raw text of the input. */
export function setNumber(label: string, value: string): void {
  fireEvent.change(screen.getByRole('spinbutton', { name: label }), { target: { value } });
}

/** Enters a whole date (MM/DD/YYYY) into the picker bound to `name`. */
export function pickDate(name: string, text: string): void {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) {
    throw new Error(`No date picker named ${name}`);
  }
  fireEvent.change(input, { target: { value: text } });
}

/** Opens the searchable picker labelled `label` and picks the option `option`. */
export async function pickOption(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

/** Opens the select whose label starts with `label` and picks the option `option`. */
export async function chooseOption(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await listClosed();
}

/** Waits until the open select menu has gone, so the next query sees one form again. */
export async function listClosed(): Promise<void> {
  await waitFor(() => {
    if (screen.queryByRole('listbox')) {
      throw new Error('The select menu is still open');
    }
  });
}

/** Clicks the button with the accessible name `name`. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
