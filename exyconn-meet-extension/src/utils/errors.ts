const FALLBACK = 'Something went wrong';

/** What to show for a caught value: its message if it is an Error, else `fallback`. */
export function errorText(error: unknown, fallback = FALLBACK): string {
  return error instanceof Error ? error.message : fallback;
}

/** The caught value as an Error (a thrown string or object becomes one with `fallback`). */
export function toError(error: unknown, fallback = FALLBACK): Error {
  return error instanceof Error ? error : new Error(fallback);
}
