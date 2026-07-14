import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { TrackerState } from '@shared/types';
import AppFrame from './components/AppFrame';
import AppShell from './AppShell';
import LoginScreen from './screens/LoginScreen';
import ConsentScreen from './screens/ConsentScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import useBrandTheme from './hooks/useBrandTheme';
import useShutterSound from './hooks/useShutterSound';
import useTrackerState from './hooks/useTrackerState';

interface RouterProps {
  state: TrackerState;
}

/**
 * One screen per status. `permissions.allGranted` is always true on Windows, so the
 * permissions screen only appears on macOS when a grant is still missing.
 */
function ScreenRouter({ state }: Readonly<RouterProps>): JSX.Element {
  if (state.status === 'signed-out') {
    return (
      <LoginScreen
        branding={state.branding}
        rememberMe={state.rememberMe}
        signedOutReason={state.signedOutReason}
      />
    );
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
  const state = useTrackerState();
  const theme = useBrandTheme(state?.branding ?? null);

  // At the root, not in a screen: the shutter must still sound while the app is hidden in the
  // tray, which is exactly where it is for most captures.
  useShutterSound();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppFrame>{state === null ? <Loading /> : <ScreenRouter state={state} />}</AppFrame>
    </ThemeProvider>
  );
}
