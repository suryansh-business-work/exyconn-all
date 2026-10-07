import { screen } from '@testing-library/react';

/**
 * The figure a real StatCard shows under `label`: the card is the label's grandparent and the
 * figure its one paragraph. Null while the card shows a loading placeholder instead.
 */
export function statFigure(label: string): string | null {
  const card = screen.getByText(label).parentElement?.parentElement;
  return card?.querySelector('p')?.textContent ?? null;
}
