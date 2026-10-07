import { expect } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentUrl } from './test-utils';

/** Puts a whole value into the field with this label, as a paste would. */
export function fill(label: string, value: string, scope: HTMLElement = document.body) {
  fireEvent.change(within(scope).getByLabelText(label), { target: { value } });
}

/** Opens the select whose accessible name matches, picks an option and waits for it to close. */
export async function pickOption(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** The snackbar's message, once the shared notifier has shown one. */
export const findSnackbar = (message: string) => screen.findByText(message);

/** The router's location, printed so a test can assert where a button went. */
export function CurrentUrl() {
  return <span data-testid="current-url">{useCurrentUrl()}</span>;
}

export const currentUrl = () => screen.getByTestId('current-url').textContent;
