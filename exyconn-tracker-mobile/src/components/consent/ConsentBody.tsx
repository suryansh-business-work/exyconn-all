import { useMemo, useRef, useState } from 'react';
import { Linking, PixelRatio, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import { YStack } from 'tamagui';
import {
  HEIGHT_REPORTER,
  consentDocument,
  linkAction,
  parseHeight,
} from '../../lib/consent/consent-document';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS, borderWidth } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';

/**
 * Every navigation is routed to `onNavigate`, which is where the restriction lives: the web
 * view loads nothing but its own document. A narrower list here would be LESS strict — the
 * library hands any URL outside it straight to the OS, unasked and unfiltered.
 */
const ROUTE_EVERY_NAVIGATION = ['*'];

/** Tall enough for a line of text until the page reports its real height. */
const INITIAL_HEIGHT = 48;

/** How recent a touch must be for a navigation to count as the reader's own tap. */
const TAP_WINDOW_MS = 1500;

interface Props {
  html: string;
}

/**
 * Renders the disclosure authored by a portal ADMIN, verbatim — this app never paraphrases
 * what it records. Treated as untrusted all the same (see consent-document.ts): no script of
 * its own runs, and it leaves only for the system browser, on a tap. The view is exactly as
 * tall as the text, so the screen scrolls as one page with the buttons always below it.
 */
export function ConsentBody({ html }: Readonly<Props>) {
  const brand = useBrand();
  const ink = useThemeColor('ink');
  const muted = useThemeColor('muted');
  const hairline = useThemeColor('hairline');
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const touchedAt = useRef(0);
  const fontScale = PixelRatio.getFontScale();

  const source = useMemo(
    () => ({
      html: consentDocument(html, { ink, muted, hairline, link: brand.primary }, fontScale),
    }),
    [html, ink, muted, hairline, brand.primary, fontScale],
  );

  function onNavigate(request: WebViewNavigation): boolean {
    const tapped = Date.now() - touchedAt.current < TAP_WINDOW_MS;
    const action = linkAction(request.url, tapped);
    if (action === 'browser') {
      Linking.openURL(request.url).catch((cause: unknown) =>
        console.error('Opening a disclosure link failed', cause),
      );
    }
    return action === 'stay';
  }

  function onMessage(event: WebViewMessageEvent): void {
    const reported = parseHeight(event.nativeEvent.data);
    if (reported !== null) {
      setHeight(reported);
    }
  }

  return (
    <YStack
      padding="$3"
      borderRadius={TRACKER_RADIUS}
      borderWidth={borderWidth.hairline}
      borderColor="$hairline"
      backgroundColor="$app"
    >
      <View
        onTouchStart={() => {
          touchedAt.current = Date.now();
        }}
      >
        <WebView
          source={source}
          originWhitelist={ROUTE_EVERY_NAVIGATION}
          onShouldStartLoadWithRequest={onNavigate}
          injectedJavaScript={HEIGHT_REPORTER}
          onMessage={onMessage}
          javaScriptEnabled
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
          allowFileAccess={false}
          allowsLinkPreview={false}
          domStorageEnabled={false}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={{ height, backgroundColor: 'transparent' }}
          accessibilityLabel="Monitoring disclosure"
        />
      </View>
    </YStack>
  );
}
