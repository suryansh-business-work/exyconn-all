/** The screens the marker remembers, newest last. */
export const ROUTE_HISTORY = 10;

/** What the phone writes to disk about the run in progress (see tracker/session-marker.ts). */
export interface SessionMarker {
  /** On screen right now. A run that ends while this is true did not end by the user's hand. */
  active: boolean;
  /** A fatal JS error was already reported for this run. */
  fatal: boolean;
  startedAt: string;
  routes: Array<{ route: string; at: string }>;
}

export interface UnexpectedExit {
  error: { name: string; message: string };
  context: { lastScreens: SessionMarker['routes']; startedAt: string };
}

export function parseMarker(raw: string | null): SessionMarker | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as SessionMarker;
  } catch {
    return null;
  }
}

/**
 * The report owed for the last run: one that ended on screen with no JS error behind it — a
 * native crash, or the OS killing the app. A run that went to the background first, or whose
 * fatal JS error was already sent, is owed nothing.
 */
export function unexpectedExitOf(last: SessionMarker | null): UnexpectedExit | null {
  if (!last?.active || last.fatal) {
    return null;
  }
  return {
    error: {
      name: 'UnexpectedExit',
      message: 'The app closed while open on screen (a native crash, or killed by the OS)',
    },
    context: { lastScreens: last.routes, startedAt: last.startedAt },
  };
}

export function withRoute(marker: SessionMarker, route: string, at: string): SessionMarker {
  return { ...marker, routes: [...marker.routes, { route, at }].slice(-ROUTE_HISTORY) };
}
