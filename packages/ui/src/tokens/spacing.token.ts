/** The 8px rhythm every gap, pad and inset is a multiple of. */
export const SPACING_UNIT = 8;

/** Returns `factor * SPACING_UNIT` as a raw px number (e.g. `spacing(2)` -> 16). */
export function spacing(factor: number): number {
  return factor * SPACING_UNIT;
}
