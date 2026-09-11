import { AppState } from 'react-native';
import type { Logger } from '@exyconn/logger';
import {
  parseMarker,
  unexpectedExitOf,
  withRoute,
  type SessionMarker,
} from '../lib/logs/session-marker.rules';
import { documentFile } from './json-file';

const file = documentFile('tracker-session.json');
let marker: SessionMarker = { active: false, fatal: false, startedAt: '', routes: [] };

function save(): void {
  try {
    file.write(JSON.stringify(marker));
  } catch (cause) {
    console.warn('Could not save the session marker', cause);
  }
}

/**
 * Catches the crashes JavaScript never sees. A native crash, or Android/iOS killing the app for
 * memory, runs no handler — but it leaves this marker saying the app was on screen. Leaving the
 * app normally sends it to the background first, which clears `active`, so the next launch
 * reports only the runs that really died in the user's hands, with the screens they had open.
 */
export function startSessionMarker(logger: Logger): void {
  const exit = unexpectedExitOf(parseMarker(file.read()));
  // A dev reload also ends a run on screen, so only release builds report it.
  if (exit && !__DEV__) {
    logger.capture(exit.error, { context: exit.context });
  }
  marker = {
    active: AppState.currentState === 'active',
    fatal: false,
    startedAt: new Date().toISOString(),
    routes: [],
  };
  save();
  AppState.addEventListener('change', (state) => {
    marker.active = state === 'active';
    save();
  });
}

export function markRoute(route: string): void {
  marker = withRoute(marker, route, new Date().toISOString());
  save();
}

export function markFatal(): void {
  marker.fatal = true;
  save();
}
