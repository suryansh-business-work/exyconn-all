import { fireEvent, screen } from '@testing-library/react';

/**
 * Pastes `value` into the text box whose accessible name starts with `label` — for required
 * fields, whose label carries MUI's " *" marker and so never matches `fill` exactly.
 */
export function typeInto(label: string, value: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: new RegExp(`^${label}`) }), {
    target: { value },
  });
}
