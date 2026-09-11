import { YStack } from 'tamagui';
import { LoginForm } from '../forms/login';
import { AppFooter } from '../components/shell/AppFooter';
import { ThemeToggle } from '../components/shell/ThemeToggle';
import { BrandMark } from '../components/ui/BrandMark';
import { Notice } from '../components/ui/Notice';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Surface } from '../components/ui/Surface';
import { Caption, Title } from '../components/ui/Typography';
import { useTrackerState } from '../hooks/useTrackerState';

/** Sign-in. Uses portal credentials; the shared controller validates them with the portal. */
export default function LoginScreen() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return (
    <ScreenLayout maxWidth={440}>
      <YStack alignItems="flex-end">
        <ThemeToggle mode={state.preferences.themeMode} />
      </YStack>
      <YStack alignItems="center" paddingVertical="$4">
        <BrandMark height={44} />
      </YStack>
      <Surface>
        <YStack gap="$1">
          <Title>Sign in</Title>
          <Caption>Use your Exyconn portal email and password.</Caption>
        </YStack>
        {/* The app signed them out itself — revoked access — and they are owed the reason. */}
        {state.signedOutReason === null ? null : (
          <Notice severity="warning">{state.signedOutReason}</Notice>
        )}
        <LoginForm rememberMe={state.rememberMe} />
      </Surface>
      <AppFooter />
    </ScreenLayout>
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../components/shell/ScreenErrorBoundary';
