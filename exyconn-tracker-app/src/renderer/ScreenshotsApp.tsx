import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
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
function Loading(): JSX.Element {
  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

/**
 * The screenshot gallery — a REAL second window, sharing the main window's preload, so it
 * reaches the portal the same way everything else does: through the main process, over IPC.
 * It never holds a token and never talks to the portal itself.
 */
export default function ScreenshotsApp(): JSX.Element {
  const state = useTrackerState();
  const theme = useBrandTheme(state?.branding ?? null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppFrame>
        {/* The window is frameless, so without this it could not be moved or closed. */}
        <TitleBar title="My screenshots — Exyconn Tracker" />
        {state === null ? (
          <Loading />
        ) : (
          <ScreenshotsScreen startISO={START} endISO={END} timezone={state.timezone} />
        )}
      </AppFrame>
    </ThemeProvider>
  );
}
