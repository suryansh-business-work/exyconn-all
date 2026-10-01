/**
 * Puts a checkbox's native `indeterminate` state where MUI only puts the attribute.
 *
 * MUI writes `aria-checked="mixed"` and `data-indeterminate` but leaves the input's own
 * `indeterminate` property false, so assistive tech and axe (aria-conditional-attr) see an
 * ARIA state that contradicts the native one. Passed as `inputRef`, this sets the property
 * on every render so the two always agree.
 */
export const indeterminateInput =
  (indeterminate: boolean) =>
  (input: HTMLInputElement | null): void => {
    if (input) {
      input.indeterminate = indeterminate;
    }
  };
