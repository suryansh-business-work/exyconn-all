type Level = 'info' | 'warn' | 'error';

/** One JSON line per event on stdout, read by `docker logs`; failures also reach the portal. */
export function log(level: Level, message: string, details: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...details });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : JSON.stringify(error);
