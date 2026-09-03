import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { TrackerState } from '@shared/types';
import AppFrame from './components/AppFrame';
import ClosingDialog from './components/ClosingDialog';
import AppShell from './AppShell';
import LoginScreen from './screens/LoginScreen';
import ConsentScreen from './screens/ConsentScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import useBrandTheme from './hooks/useBrandTheme';
import useShutterSound from './hooks/useShutterSound';
import useCaptureBridge from './hooks/useCaptureBridge';
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
  const theme = useBrandTheme(state?.branding ?? null, state?.preferences.themeMode);

  // Both at the root, not in a screen, and for the same reason: a capture fires whatever page
  // the employee is on — including no page at all, with the app hidden in the tray, which is
  // where it is for most captures. The shutter must still sound, and the webcam photo (which
  // only a renderer can take) must still be produced.
  useShutterSound();
  useCaptureBridge();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppFrame>{state === null ? <Loading /> : <ScreenRouter state={state} />}</AppFrame>
      {/* At the root: a quit can be asked for from any page, and from the tray. */}
      <ClosingDialog />
    </ThemeProvider>
  );
}
