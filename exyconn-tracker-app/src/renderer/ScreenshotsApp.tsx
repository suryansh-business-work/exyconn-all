import type { ReactElement } from 'react';
import { Box, CircularProgress, ThemeProvider } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { deviceTimezone } from '@exyconn/tracker-core';
import type { TrackerState } from '@shared/types';
import TrackerI18nProvider from './i18n/TrackerI18nProvider';
import AppFrame from './components/AppFrame';
import TitleBar from './components/TitleBar';
import ScreenshotsScreen from './screens/ScreenshotsScreen';
import useBrandTheme from './hooks/useBrandTheme';
import useTrackerState from './hooks/useTrackerState';

/**
 * The day this window was opened for, read from its own URL. The main process puts the bounds
 * in the query string when it opens (or re-points) the window, so a reload always lands on the
 * same day — a module-level constant, because a reload is the only way it can change.
 */
const params = new URLSearchParams(window.location.search);
const START = params.get('start') ?? '';
const END = params.get('end') ?? '';

/** Full-bleed spinner shown until the first state snapshot lands (we need the zone and theme). */
function Loading(): ReactElement {
  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

/** The window's own chrome and body, inside the language the gallery is read in. */
function Gallery({ state }: Readonly<{ state: TrackerState | null }>): ReactElement {
  const t = useT();

  return (
    <AppFrame>
      {/* The window is frameless, so without this it could not be moved or closed. */}
      <TitleBar title={t('My screenshots — Exyconn Tracker')} />
      {state === null ? (
        <Loading />
      ) : (
        <ScreenshotsScreen startISO={START} endISO={END} timezone={state.timezone} />
      )}
    </AppFrame>
  );
}

/**
 * The screenshot gallery — a REAL second window, sharing the main window's preload, so it
 * reaches the portal the same way everything else does: through the main process, over IPC.
 * It never holds a token and never talks to the portal itself.
 */
export default function ScreenshotsApp(): ReactElement {
  const state = useTrackerState();
  const theme = useBrandTheme(state?.branding ?? null, state?.preferences.themeMode);

  // This is a SECOND window with its own React root, so it needs its own provider — the main
  // window's does not reach it, and without one the gallery would be the one screen in the
  // app still in English.
  return (
    <TrackerI18nProvider
      locale={state?.locale ?? null}
      timezone={state?.timezone ?? deviceTimezone()}
    >
      <ThemeProvider theme={theme}>
        <Gallery state={state} />
      </ThemeProvider>
    </TrackerI18nProvider>
  );
}
