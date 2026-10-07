import { fireEvent } from '@testing-library/react';

/** A form's text field by its name — every TextField is the input whose id is the field name. */
export function inputOf(name: string): HTMLInputElement {
  const element = document.getElementById(name);
  if (!(element instanceof HTMLInputElement)) {
    throw new TypeError(`No text field named "${name}".`);
  }
  return element;
}

/** Types into a form's text field, as the employee would. */
export function typeInto(name: string, value: string): void {
  fireEvent.change(inputOf(name), { target: { value } });
}
