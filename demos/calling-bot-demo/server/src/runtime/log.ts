/**
 * One JSON line per event on stdout/stderr, which `docker logs` keeps. Never a key, a ticket
 * or a caller's words: an event names the call by id and says what happened.
 */
type Fields = Record<string, string | number | boolean | null | undefined>;

function write(level: 'info' | 'warn' | 'error', message: string, fields: Fields): void {
  const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...fields });
  if (level === 'info') {
    process.stdout.write(`${line}\n`);
  } else {
    process.stderr.write(`${line}\n`);
  }
}

/** An error's message, whatever was thrown. */
export const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : JSON.stringify(error);

export const log = {
  info: (message: string, fields: Fields = {}) => write('info', message, fields),
  warn: (message: string, fields: Fields = {}) => write('warn', message, fields),
  error: (message: string, fields: Fields = {}) => write('error', message, fields),
};
