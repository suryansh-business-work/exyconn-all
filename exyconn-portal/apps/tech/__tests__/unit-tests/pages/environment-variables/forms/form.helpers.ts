import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';

/** Types a whole value into the text field with this label, as a paste would. */
export function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Waits until no select menu is open, so the next one opened is the only listbox. */
export async function menuClosed() {
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** Opens the select whose accessible name matches and clicks one of its options. */
export async function pickOption(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await menuClosed();
}

/** Opens a multi-select, ticks each option, then closes the menu with Escape. */
export async function pickMany(name: RegExp, options: readonly string[]) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  for (const option of options) {
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: option }),
    );
  }
  await userEvent.keyboard('{Escape}');
  await menuClosed();
}

/** The snackbar's message. Hidden from the accessibility tree while a drawer is open. */
export async function toast(): Promise<HTMLElement> {
  return screen.findByRole('alert', { hidden: true });
}

/** Clicks a button by its accessible name. */
export async function press(name: string) {
  await userEvent.click(screen.getByRole('button', { name }));
}

/** Waits for every message to be on screen. */
export async function expectMessages(...messages: string[]) {
  expect(await screen.findByText(messages[0])).toBeInTheDocument();
  for (const message of messages.slice(1)) {
    expect(screen.getByText(message)).toBeInTheDocument();
  }
}

/**
 * A credential-shaped value built at runtime, never a literal secret: the prefix a provider
 * uses followed by `length` filler characters.
 */
export function fakeSecret(prefix: string, length: number): string {
  return prefix + 'a1'.repeat(Math.ceil(length / 2)).slice(0, length);
}

/** The onDone/onCancel pair every config form takes, reset between tests. */
export function formCallbacks() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  return {
    onDone,
    onCancel,
    reset() {
      onDone.mockReset();
      onCancel.mockReset();
    },
  };
}

/** Waits until the form has handed control back once. */
export async function doneOnce(onDone: ReturnType<typeof vi.fn>) {
  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
}
