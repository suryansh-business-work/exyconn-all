import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { CHROME, FALLBACK_BRAND, ON_DARK } from '../../theme/palette';
import { logger } from '../../tracker/logger';

/**
 * The last line before the app closes: what the ROOT layout shows when something above the
 * screens throws — the providers, the update banner, or a screen's file failing to load while
 * its navigator renders. Plain React Native only, because it renders OUTSIDE the Tamagui and
 * brand providers (either of which may be what failed).
 */
export function RootErrorBoundary({ error, retry }: Readonly<ErrorBoundaryProps>) {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    logger.capture(error, { context: { boundary: 'root' } });
  }, [error]);

  return (
    <View style={[styles.page, { backgroundColor: chrome.app }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: chrome.ink }]}>
        The app hit a problem
      </Text>
      <Text style={[styles.body, { color: chrome.muted }]}>
        It has been reported to the Exyconn tech team.
      </Text>
      <Text style={[styles.body, { color: chrome.error }]}>{error.message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          retry().catch((cause: unknown) => logger.capture(cause));
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: FALLBACK_BRAND.primary,
  },
  buttonText: { color: ON_DARK, fontSize: 16, fontWeight: '600' },
});
