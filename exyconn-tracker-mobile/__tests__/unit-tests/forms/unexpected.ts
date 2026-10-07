/**
 * A translator that breaks on one sentence — the way to reach a form's last-resort handler,
 * which must log a failure it did not expect rather than leave an unhandled rejection.
 */
export function failingOn(source: string, failure: Error): (missing: string) => void {
  return (missing) => {
    if (missing === source) {
      throw failure;
    }
  };
}
