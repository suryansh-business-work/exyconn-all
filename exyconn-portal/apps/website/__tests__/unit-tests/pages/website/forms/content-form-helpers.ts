import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Types into the text field labelled `label`, replacing what was there. */
export async function fillField(label: string, text: string): Promise<void> {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, text);
}

/** Clicks a button by its accessible name. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
