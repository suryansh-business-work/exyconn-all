import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

/** Types a whole value into the text field with this label, as a paste would. */
export function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Waits until no select menu is open, so the next one opened is the only listbox. */
async function menuClosed() {
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** Opens the select whose accessible name matches and clicks one of its options. */
export async function pickOption(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await menuClosed();
}

/** The option labels a select offers, read by opening it and closing it again. */
export async function optionsOf(name: RegExp): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name }));
  const labels = within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  await menuClosed();
  return labels;
}

/** Types into a searchable picker and chooses the option that appears. */
export async function choose(label: string, typed: string, option: string) {
  await userEvent.type(screen.getByRole('combobox', { name: label }), typed);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

/** The snackbar's message. Hidden from the accessibility tree while a drawer is open. */
export async function toast(): Promise<HTMLElement> {
  return screen.findByRole('alert', { hidden: true });
}

/** Clicks a button by its accessible name. */
export async function press(name: string) {
  await userEvent.click(screen.getByRole('button', { name }));
}
