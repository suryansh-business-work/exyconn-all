import { LOG_LIMITS, contextText, cut, describeValue, type Described } from './describe';
import type {
  CaptureOptions,
  LogBreadcrumb,
  LogEntry,
  LogLevel,
  LogStorage,
  Logger,
  LoggerConfig,
} from './types';

/** Entries per `reportClientLogs` call — the server accepts at most 50. */
export const LOG_BATCH_SIZE = 25;
/** Past this the oldest entries are dropped: a device offline for a week keeps the newest. */
export const MAX_QUEUED_LOGS = 200;
const MAX_BREADCRUMBS = 30;
const DEFAULT_FLUSH_MS = 10_000;

/** Ties one run's logs together. Not a secret, so `Math.random` is enough. */
function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function restore(storage: LogStorage | undefined): LogEntry[] {
  const raw = storage?.read();
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function sameProblem(a: LogEntry, b: LogEntry): boolean {
  return (
    a.level === b.level &&
    a.message === b.message &&
    a.errorName === b.errorName &&
    a.route === b.route
  );
}

/** "Saving failed: Network request failed" — the call site's words, then the error's. */
function joinMessage(message: string, described: Described | null): string {
  const detail = described?.text ?? '';
  if (!message) {
    return detail;
  }
  return detail && detail !== message ? `${message}: ${detail}` : message;
}

/**
 * The client half of Tech > Logs. Every entry is written to `storage` before anything else
 * happens, so an error that kills the app is still sent on the next launch. Errors are sent
 * at once; everything else waits up to `flushIntervalMs` for company. An entry identical to
 * one still waiting is folded into it (`count`), so a render loop sends one row, not a
 * thousand. A failed send keeps the batch for the next attempt.
 */
export function createLogger(config: LoggerConfig): Logger {
  const sessionId = newSessionId();
  const interval = config.flushIntervalMs ?? DEFAULT_FLUSH_MS;
  const queue = restore(config.storage);
  const inFlight = new Set<LogEntry>();
  const crumbs: LogBreadcrumb[] = [];
  let route: string | null = null;
  let sending = false;
  let recording = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function persist(): void {
    try {
      config.storage?.write(JSON.stringify(queue));
    } catch {
      // A full disk or quota must never break the app the logger is watching.
    }
  }

  function addCrumb(level: LogLevel, message: string): void {
    crumbs.push({
      at: new Date().toISOString(),
      level,
      message: cut(message, LOG_LIMITS.breadcrumb) ?? '',
    });
    if (crumbs.length > MAX_BREADCRUMBS) {
      crumbs.shift();
    }
  }

  function schedule(delay: number): void {
    if (timer !== null) {
      if (delay > 0) {
        return;
      }
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      flush().catch(() => undefined);
    }, delay);
  }

  function enqueue(entry: LogEntry): void {
    const twin = queue.find((queued) => !inFlight.has(queued) && sameProblem(queued, entry));
    if (twin) {
      twin.count += 1;
    } else {
      queue.push(entry);
      if (queue.length > MAX_QUEUED_LOGS) {
        queue.splice(0, queue.length - MAX_QUEUED_LOGS);
      }
    }
    persist();
    schedule(entry.level === 'ERROR' ? 0 : interval);
  }

  function record(
    level: LogLevel,
    message: string,
    described: Described | null,
    options: Omit<CaptureOptions, 'level'> = {},
  ): void {
    // A logger that logs while logging (a storage error echoed to the console) stops here.
    if (recording) {
      return;
    }
    recording = true;
    try {
      const text = cut(joinMessage(message, described), LOG_LIMITS.message) ?? '(no message)';
      const loud = level === 'ERROR' || level === 'WARN';
      enqueue({
        level,
        message: text,
        errorName: described?.errorName ?? null,
        stack: cut(described?.stack, LOG_LIMITS.stack),
        componentStack: cut(options.componentStack, LOG_LIMITS.componentStack),
        route,
        context: contextText(options.context),
        count: 1,
        occurredAt: new Date().toISOString(),
        breadcrumbs: loud ? [...crumbs] : [],
      });
      addCrumb(level, text);
    } finally {
      recording = false;
    }
  }

  function removeSent(entries: LogEntry[]): void {
    for (const entry of entries) {
      const index = queue.indexOf(entry);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
    persist();
  }

  async function flush(): Promise<void> {
    if (sending || queue.length === 0) {
      return;
    }
    sending = true;
    const entries = queue.slice(0, LOG_BATCH_SIZE);
    for (const entry of entries) {
      inFlight.add(entry);
    }
    let sent = false;
    try {
      const batch = { ...config.device(), source: config.source, app: config.app, sessionId };
      await config.send({ ...batch, user: config.user(), entries });
      removeSent(entries);
      sent = true;
    } catch {
      // Offline or the portal is down: the entries stay queued (and on disk) for next time.
    } finally {
      inFlight.clear();
      sending = false;
    }
    if (queue.length > 0) {
      schedule(sent ? 0 : interval);
    }
  }

  const withDetail =
    (level: LogLevel) =>
    (message: string, detail?: unknown, context?: Record<string, unknown>): void => {
      record(level, message, detail === undefined ? null : describeValue(detail), { context });
    };

  if (queue.length > 0) {
    schedule(0);
  }

  return {
    error: withDetail('ERROR'),
    warn: withDetail('WARN'),
    info: (message, context) => record('INFO', message, null, { context }),
    debug: (message, context) => record('DEBUG', message, null, { context }),
    capture: (error, options = {}) =>
      record(options.level ?? 'ERROR', '', describeValue(error), options),
    breadcrumb: (message, level = 'DEBUG') => addCrumb(level, message),
    setRoute: (next) => {
      if (next !== route) {
        route = next;
        addCrumb('DEBUG', `Opened ${next}`);
      }
    },
    flush,
  };
}
