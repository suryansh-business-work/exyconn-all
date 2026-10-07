import { vi } from 'vitest';

let counter = 0;

/** `expo-crypto`: deterministic ids (`uuid-1`, `uuid-2`, …) so assertions can name them. */
export const randomUUID = vi.fn(() => {
  counter += 1;
  return `uuid-${counter}`;
});
