import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** A field's label as written, or followed by the red star a required field adds. */
function labelled(label: string | RegExp): RegExp {
  if (label instanceof RegExp) {
    return label;
  }
  const escaped = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(String.raw`^${escaped}\s*\*?$`);
}

/** Types a whole value into the field with this label, as a paste would. */
export function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(labelled(label)), { target: { value } });
}

/** Opens the select whose accessible name matches, picks an option and waits for it to close. */
export async function pickOption(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

/** Clicks the button with exactly this accessible name. */
export function click(name: string) {
  return userEvent.click(screen.getByRole('button', { name }));
}
