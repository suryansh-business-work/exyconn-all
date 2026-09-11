import type { ReactElement } from 'react';
import { Box, CircularProgress, ThemeProvider } from '@exyconn/ui';
import type { TrackerState } from '@shared/types';
import { groundOpacity } from '@shared/transparency';
import { deviceTimezone } from '@exyconn/tracker-core';
import AppFrame from './components/AppFrame';
import ClosingDialog from './components/ClosingDialog';
import AppShell from './AppShell';
import LoginScreen from './screens/LoginScreen';
import ConsentScreen from './screens/ConsentScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import useBrandTheme from './hooks/useBrandTheme';
import useShutterSound from './hooks/useShutterSound';
import useCaptureNotification from './hooks/useCaptureNotification';
import useCaptureBridge from './hooks/useCaptureBridge';
import useTrackerState from './hooks/useTrackerState';
import useUpdateState from './hooks/useUpdateState';
import UpdateBanner from './components/UpdateBanner';

interface RouterProps {
  state: TrackerState;
}

/**
 * One screen per status. `permissions.allGranted` is always true on Windows, so the
 * permissions screen only appears on macOS when a grant is still missing.
 */
function ScreenRouter({ state }: Readonly<RouterProps>): ReactElement {
  if (state.status === 'signed-out') {
    return (
      <LoginScreen
        branding={state.branding}
        rememberMe={state.rememberMe}
        signedOutReason={state.signedOutReason}
        themeMode={state.preferences.themeMode}
      />
    );
  }
  if (state.status === 'consent-required') {
    return (
      <ConsentScreen
        branding={state.branding}
        settings={state.settings}
        policy={state.consentPolicy}
      />
    );
  }
  if (!state.permissions.allGranted) {
    return <PermissionsScreen permissions={state.permissions} />;
  }
  return <AppShell state={state} />;
}

/** Full-bleed spinner shown until the first state snapshot lands. */
function Loading(): ReactElement {
  return (
    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

/** Subscribes to the tracker state, themes the app from the portal branding, and routes. */
export default function App(): ReactElement {
  const state = useTrackerState();
  const update = useUpdateState();
  const theme = useBrandTheme(state?.branding ?? null, state?.preferences.themeMode);

  // All three at the root, not in a screen, and for the same reason: a capture fires whatever
  // page the employee is on — including no page at all, with the app hidden in the tray, which
  // is where it is for most captures. The shutter must still sound, the webcam photo (which
  // only a renderer can take) must still be produced, and a click on the notification must
  // still find its way to the gallery.
  useShutterSound();
  useCaptureBridge();
  useCaptureNotification(state?.timezone ?? deviceTimezone());

  return (
    <ThemeProvider theme={theme}>
      <AppFrame
        groundOpacity={
          state === null
            ? 1
            : groundOpacity(window.tracker.transparencySupported, state.preferences)
        }
      >
        {/* Above the router: a new version matters on the login screen too. */}
        <UpdateBanner update={update} />
        {state === null ? <Loading /> : <ScreenRouter state={state} />}
      </AppFrame>
      {/* At the root: a quit can be asked for from any page, and from the tray. */}
      <ClosingDialog />
    </ThemeProvider>
  );
}
