/** `expo-image`: an <img>; `fireEvent.load` / `fireEvent.error` drive onLoad / onError. */
interface Props {
  source?: { uri?: string } | number | string | null;
  accessibilityLabel?: string;
  accessible?: boolean;
  testID?: string;
  onLoad?: () => void;
  onError?: () => void;
  contentFit?: string;
  recyclingKey?: string | null;
  transition?: number;
  style?: unknown;
}

function srcOf(source: Props['source']): string | undefined {
  if (typeof source === 'string') {
    return source;
  }
  return typeof source === 'object' && source !== null ? source.uri : undefined;
}

export function Image({ source, accessibilityLabel, testID, onLoad, onError }: Readonly<Props>) {
  return (
    <img
      src={srcOf(source)}
      alt={accessibilityLabel ?? ''}
      data-testid={testID}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
