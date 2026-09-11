import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';
import { UpdateBanner } from '../components/shell/UpdateBanner';
import { Ground } from '../components/ui/Ground';
import { useLogContext } from '../hooks/useLogContext';
import { useTrackerState } from '../hooks/useTrackerState';
import { BrandProvider, useBrand } from '../theme/BrandProvider';
import { INTER_FILES } from '../theme/fonts';
import { bootTracker } from '../tracker/instance';
import { run } from '../tracker/run';
import { scheduleUpdateChecks } from '../tracker/updates';
import type { MobileTrackerState } from '../tracker/types';

/** Below half, text sitting on the ground loses its contrast against the gradient. */
const MIN_GROUND_OPACITY = 0.5;

/** Every screen is transparent: the one `Ground` under the stack paints behind all of them. */
const CLEAR_SCREEN = { backgroundColor: 'transparent' } as const;

/** Full-bleed spinner until the first state snapshot (and the app's font) lands. */
function Loading() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center">
      <Spinner size="large" accessibilityLabel="Loading" />
    </YStack>
  );
}

/**
 * One screen per status, as the desktop routes: sign-in, consent, the OS grants, then the app.
 * Each guard admits its screens only in that state, so the router moves on by itself the
 * moment the tracker's status changes — no screen navigates on success.
 */
function RootStack({ state }: Readonly<{ state: MobileTrackerState }>) {
  const signedOut = state.status === 'signed-out';
  const consenting = state.status === 'consent-required';
  const granted = state.permissions.allGranted;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: CLEAR_SCREEN }}>
      <Stack.Protected guard={signedOut}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={consenting}>
        <Stack.Screen name="consent" />
      </Stack.Protected>
      <Stack.Protected guard={!signedOut && !consenting && !granted}>
        <Stack.Screen name="permissions" />
      </Stack.Protected>
      <Stack.Protected guard={!signedOut && !consenting && granted}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="screenshots" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedStatusBar() {
  const { scheme } = useBrand();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

/** The see-through ground's opacity for these preferences: 1 is solid. */
function groundOpacityOf(state: MobileTrackerState | null): number {
  if (state?.preferences.transparentBackground !== true) {
    return 1;
  }
  // A value saved when the floor was 30% is kept frosted.
  return Math.max(MIN_GROUND_OPACITY, state.preferences.backgroundOpacity);
}

export default function RootLayout() {
  const state = useTrackerState();
  const [fontsLoaded, fontError] = useFonts(INTER_FILES);
  useLogContext(state);

  const signedIn = state !== null && state.status !== 'signed-out';
  // A font that fails to load leaves the system face in its place; the app still opens.
  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    run(bootTracker);
  }, []);

  useEffect(() => {
    if (fontError !== null) {
      console.error('The Inter font could not be loaded', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    scheduleUpdateChecks(signedIn);
  }, [signedIn]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BrandProvider
          branding={state?.branding ?? null}
          themeMode={state?.preferences.themeMode ?? 'system'}
          groundOpacity={groundOpacityOf(state)}
        >
          <Ground />
          <ThemedStatusBar />
          {/* Above the router: a new version matters on the sign-in screen too. */}
          {fontsSettled ? <UpdateBanner /> : null}
          {state === null || !fontsSettled ? <Loading /> : <RootStack state={state} />}
        </BrandProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Above every screen's own boundary: a throw in the providers, the banner, or a screen's file
// loading while its navigator renders lands here instead of closing the app.
export { RootErrorBoundary as ErrorBoundary } from '../components/shell/RootErrorBoundary';
