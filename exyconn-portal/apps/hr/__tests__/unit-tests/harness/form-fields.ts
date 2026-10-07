import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

/** Enters `text` in the text field labelled `label`, replacing what was there. */
export async function fillField(label: string, text: string): Promise<void> {
  const field = screen.getByRole('textbox', { name: label });
  await userEvent.clear(field);
  if (text !== '') {
    await userEvent.click(field);
    await userEvent.paste(text);
  }
}

/** Sets a number field the way a browser reports it: the raw text of the input. */
export function setNumber(label: string, value: string): void {
  const field = screen.getByRole('spinbutton', { name: label });
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

/** Waits for an open menu to finish closing, so the next select opens the only listbox. */
async function menuClosed(): Promise<void> {
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/**
 * The combobox labelled `label`. A MUI select's accessible name is its label followed by the
 * value it shows, so the match is on the start of the name.
 */
export function combobox(label: string): HTMLElement {
  const escaped = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return screen.getByRole('combobox', { name: new RegExp(`^${escaped}`) });
}

/** Opens the select or autocomplete labelled `label` and picks the option named `option`. */
export async function chooseOption(label: string, option: string): Promise<void> {
  await userEvent.click(combobox(label));
  const listbox = await screen.findByRole('listbox');
  await userEvent.click(within(listbox).getByRole('option', { name: option }));
  await menuClosed();
}

/** The option names the select labelled `label` offers; closes the list again. */
export async function optionsOf(label: string): Promise<string[]> {
  await userEvent.click(combobox(label));
  const listbox = await screen.findByRole('listbox');
  const names = within(listbox)
    .queryAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  await menuClosed();
  return names;
}

/** Clicks a button by its accessible name. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
