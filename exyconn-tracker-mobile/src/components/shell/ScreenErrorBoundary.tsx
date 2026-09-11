import { useEffect } from 'react';
import type { ErrorBoundaryProps } from 'expo-router';
import { YStack } from 'tamagui';
import { logger } from '../../tracker/logger';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Surface } from '../ui/Surface';
import { Caption, Title } from '../ui/Typography';

/**
 * What a screen shows instead of closing the app when it throws while rendering. Every route
 * exports it as its `ErrorBoundary`, so the drawer and the other screens keep working, and the
 * error goes to Tech > Logs with the screen it happened on.
 */
export function ScreenErrorBoundary({ error, retry }: Readonly<ErrorBoundaryProps>) {
  useEffect(() => {
    logger.capture(error, { context: { boundary: 'screen' } });
  }, [error]);

  return (
    <ScreenLayout maxWidth={440}>
      <Surface>
        <YStack gap="$1">
          <Title>This screen hit a problem</Title>
          <Caption>It has been reported to the Exyconn tech team.</Caption>
        </YStack>
        <Notice severity="error">{error.message}</Notice>
        <AppButton
          label="Try again"
          icon="refresh"
          onPress={() => {
            retry().catch((cause: unknown) => logger.capture(cause));
          }}
          full
        />
      </Surface>
    </ScreenLayout>
  );
}
