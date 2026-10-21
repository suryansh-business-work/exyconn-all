/**
 * A rejection handler for fire-and-forget promises: it logs `context` with the error, so a
 * failure is never dropped silently. Use it as `promise.catch(logFailure('What failed'))`.
 */
export const logFailure =
  (context: string) =>
  (error: unknown): void => {
    console.error(context, error);
  };
