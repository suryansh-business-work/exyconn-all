/**
 * `react-native-webview`: renders a labelled placeholder and records its props, so a test can
 * play the page's side: `webViewTest.last()?.onMessage?.({ nativeEvent: { data: '640' } })`.
 */
export interface WebViewNavigation {
  url: string;
}

export interface WebViewMessageEvent {
  nativeEvent: { data: string };
}

interface Props {
  source?: { uri?: string; html?: string };
  accessibilityLabel?: string;
  onShouldStartLoadWithRequest?: (request: WebViewNavigation) => boolean;
  onMessage?: (event: WebViewMessageEvent) => void;
  injectedJavaScript?: string;
  [option: string]: unknown;
}

const rendered: Props[] = [];

export function WebView(props: Readonly<Props>) {
  rendered.push(props);
  return (
    <div
      data-testid="webview"
      role="document"
      aria-label={props.accessibilityLabel}
      data-uri={props.source?.uri}
    >
      {props.source?.html}
    </div>
  );
}

export const webViewTest = {
  /** The props of the most recent render. */
  last: (): Props | undefined => rendered.at(-1),
  clear: () => {
    rendered.length = 0;
  },
};
