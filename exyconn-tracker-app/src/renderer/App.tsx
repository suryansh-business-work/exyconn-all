import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { TrackerState } from '@shared/types';
import AppBackground from './components/AppBackground';
import AppShell from './AppShell';
import LoginScreen from './screens/LoginScreen';
import ConsentScreen from './screens/ConsentScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import { buildTheme } from './theme';

interface RouterProps {
  state: TrackerState;
}

/**
 * One screen per status. `permissions.allGranted` is always true on Windows, so the
 * permissions screen only appears on macOS when a grant is still missing.
 */
function ScreenRouter({ state }: Readonly<RouterProps>): JSX.Element {
  if (state.status === 'signed-out') {
    return <LoginScreen branding={state.branding} rememberMe={state.rememberMe} />;
  }
  if (state.status === 'consent-required') {
    return <ConsentScreen branding={state.branding} settings={state.settings} />;
  }
  if (!state.permissions.allGranted) {
    return <PermissionsScreen permissions={state.permissions} />;
  }
  return <AppShell state={state} />;
}

/** Full-bleed spinner shown until the first state snapshot lands. */
function Loading(): JSX.Element {
  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

/** Subscribes to the tracker state, themes the app from the portal branding, and routes. */
export default function App(): JSX.Element {
  const [state, setState] = useState<TrackerState | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = window.tracker.onStateChanged((next) => {
      if (active) {
        setState(next);
      }
    });
    window.tracker
      .getState()
      .then((initial) => {
        if (active) {
          setState(initial);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load tracker state', error);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const branding = state?.branding ?? null;
  // The state object is republished every second, so key the theme on the four colours
  // buildTheme actually reads — otherwise every tick would rebuild the whole theme.
  const theme = useMemo(
    () => buildTheme(branding),
    [
      branding?.primaryColor,
      branding?.secondaryColor,
      branding?.backgroundColor,
      branding?.textColor,
    ],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBackground>{state === null ? <Loading /> : <ScreenRouter state={state} />}</AppBackground>
    </ThemeProvider>
  );
}
