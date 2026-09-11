/** Mirrors the portal's `AppLogLevel` / `AppLogSource` enums (reportClientLogs). */
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type LogSource = 'PORTAL' | 'DESKTOP' | 'MOBILE' | 'SERVER';

export interface LogBreadcrumb {
  at: string;
  level: LogLevel;
  message: string;
}

/** One queued log, shaped like the portal's `AppLogEntryInput`. */
export interface LogEntry {
  level: LogLevel;
  message: string;
  errorName: string | null;
  stack: string | null;
  componentStack: string | null;
  route: string | null;
  /** JSON text. */
  context: string | null;
  /** Identical entries folded into this one while it waited to be sent. */
  count: number;
  occurredAt: string;
  breadcrumbs: LogBreadcrumb[];
}

export interface LogUser {
  id: string;
  name: string;
  email: string;
}

/** What the app knows about the build and device it runs on. Read at send time. */
export interface LogDevice {
  appVersion: string | null;
  platform: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  deviceId: string | null;
}

/** One call to `reportClientLogs`, shaped like the portal's `AppLogBatchInput`. */
export interface LogBatch extends LogDevice {
  source: LogSource;
  app: string;
  sessionId: string;
  user: LogUser | null;
  entries: LogEntry[];
}

/** Synchronous, so a queued log is on disk before a fatal error kills the process. */
export interface LogStorage {
  read(): string | null;
  write(value: string): void;
}

export interface LoggerConfig {
  source: LogSource;
  /** Which app: a portal name (tech, hr), tracker-desktop or tracker-mobile. */
  app: string;
  /** Delivers one batch. A rejection keeps the batch queued for the next attempt. */
  send: (batch: LogBatch) => Promise<unknown>;
  device: () => LogDevice;
  /** The signed-in user, or null — the server prefers the request's own session. */
  user: () => LogUser | null;
  /** Where the queue survives a crash or a reload. In memory only when omitted. */
  storage?: LogStorage;
  /** How long a non-error log waits for company before the queue is sent. */
  flushIntervalMs?: number;
}

/** Extra detail for one captured error. */
export interface CaptureOptions {
  level?: LogLevel;
  componentStack?: string | null;
  context?: Record<string, unknown>;
}

export interface Logger {
  error(message: string, detail?: unknown, context?: Record<string, unknown>): void;
  warn(message: string, detail?: unknown, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  /** Queues a thrown value (an Error or anything else) as its own entry. */
  capture(error: unknown, options?: CaptureOptions): void;
  /** Records what the app is doing without sending it; it rides along with the next error. */
  breadcrumb(message: string, level?: LogLevel): void;
  /** The screen or page now showing; stamped on every entry and noted as a breadcrumb. */
  setRoute(route: string): void;
  /** Sends what is queued now. Resolves once the attempt is over, whatever its outcome. */
  flush(): Promise<void>;
}
