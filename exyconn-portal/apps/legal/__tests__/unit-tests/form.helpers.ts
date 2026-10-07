import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** A field's input by its name — date pickers are addressable as input[name="…"]. */
export function inputNamed(name: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) {
    throw new Error(`No input named ${name}`);
  }
  return input;
}

/** Types a whole value into the field with this label, as a paste would. */
export function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Types a date into a picker the way a person does, MM/DD/YYYY. */
export function pickDate(name: string, typed: string) {
  fireEvent.change(inputNamed(name), { target: { value: typed } });
}

/** The ISO string a picker stores for a day, at local midnight. */
export const localIso = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, day).toISOString();

/** Opens the select whose accessible name matches, picks an option and waits for it to close. */
export async function pickOption(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** Submits the form directly, whatever its button says. */
export function submitForm() {
  const form = document.querySelector('form');
  if (!form) {
    throw new Error('No form rendered');
  }
  fireEvent.submit(form);
}
