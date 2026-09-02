/** Message to surface for a thrown value: the Error's own message, else `fallback`. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
