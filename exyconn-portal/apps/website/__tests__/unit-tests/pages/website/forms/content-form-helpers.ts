import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** A field's label as written, or followed by the red star a required field adds. */
function labelled(label: string | RegExp): RegExp {
  if (label instanceof RegExp) {
    return label;
  }
  const escaped = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(String.raw`^${escaped}\s*\*?$`);
}

/** Types into the text field labelled `label`, replacing what was there. */
export async function fillField(label: string, text: string): Promise<void> {
  const field = screen.getByLabelText(labelled(label));
  await userEvent.clear(field);
  await userEvent.type(field, text);
}

/** Clicks a button by its accessible name. */
export async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name }));
}
