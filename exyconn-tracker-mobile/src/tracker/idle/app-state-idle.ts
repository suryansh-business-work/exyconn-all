import { AppState, type AppStateStatus } from 'react-native';

/**
 * iOS's idle reading: the app off screen counts as the phone not being used for work, because
 * iOS lets no app see anything beyond itself.
 *
 * Same contract as the Android module's `getIdleSeconds`: the current run while the app is away,
 * else the length of the run that just ended exactly once — iOS suspends JS in the background,
 * so the first tick after coming back is the only moment the run can be seen at all, and it is
 * what lets a phone left locked over lunch pause itself.
 */
let awaySince: number | null = null;
let completedRunMs = 0;

function onChange(status: AppStateStatus): void {
  const now = Date.now();
  if (status === 'active') {
    if (awaySince !== null) {
      completedRunMs = now - awaySince;
      awaySince = null;
    }
    return;
  }
  awaySince ??= now;
}

AppState.addEventListener('change', onChange);

export function appStateIdleSeconds(): number {
  if (awaySince !== null) {
    return (Date.now() - awaySince) / 1000;
  }
  const reported = completedRunMs / 1000;
  completedRunMs = 0;
  return reported;
}
