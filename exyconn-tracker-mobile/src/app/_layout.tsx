import * as Notifications from 'expo-notifications';
import { Stack, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';
import { UpdateBanner } from '../components/shell/UpdateBanner';
import { useTrackerState } from '../hooks/useTrackerState';
import { BrandProvider, useBrand } from '../theme/BrandProvider';
import { bootTracker } from '../tracker/instance';
import { run } from '../tracker/run';
import { scheduleUpdateChecks } from '../tracker/updates';
import type { MobileTrackerState } from '../tracker/types';

/** Full-bleed spinner until the first state snapshot lands. */
function Loading() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$app">
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
    <Stack screenOptions={{ headerShown: false }}>
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

/** Opens what a tapped alert points at — the dashboard after a pause, Messages for a message. */
function useNotificationRouting(): void {
  const router = useRouter();
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url: unknown = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as Href);
      }
    });
    return () => subscription.remove();
  }, [router]);
}

function ThemedStatusBar() {
  const { scheme } = useBrand();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const state = useTrackerState();
  useNotificationRouting();

  const signedIn = state !== null && state.status !== 'signed-out';

  useEffect(() => {
    run(bootTracker);
  }, []);

  useEffect(() => {
    scheduleUpdateChecks(signedIn);
  }, [signedIn]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BrandProvider
          branding={state?.branding ?? null}
          themeMode={state?.preferences.themeMode ?? 'system'}
        >
          <ThemedStatusBar />
          {/* Above the router: a new version matters on the sign-in screen too. */}
          <UpdateBanner />
          {state === null ? <Loading /> : <RootStack state={state} />}
        </BrandProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
