import { expect } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentUrl } from './test-utils';

/** A field's label as written, or followed by the red star a required field adds. */
function labelled(label: string | RegExp): RegExp {
  if (label instanceof RegExp) {
    return label;
  }
  const escaped = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(String.raw`^${escaped}\s*\*?$`);
}

/**
 * Puts a whole value into the field with this label, as a paste would. A required field's
 * label ends in " *", so match those with a pattern such as /^Your full name/.
 */
export function fill(label: string | RegExp, value: string, scope: HTMLElement = document.body) {
  fireEvent.change(within(scope).getByLabelText(labelled(label)), { target: { value } });
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
