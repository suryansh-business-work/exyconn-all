import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

/** Replaces the whole value of the text field labelled `label`, as a paste would. */
export function fill(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Opens the select labelled `label` and picks the option with the visible text `option`. */
export async function chooseOption(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** The option labels the select labelled `label` offers; closes the list again. */
export async function optionsOf(label: string): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name: new RegExp(`^${label}`) }));
  const labels = within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  return labels;
}

/** Clicks the button with this accessible name. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
