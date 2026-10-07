/** `expo-status-bar`: renders a marker carrying the chosen style. */
export function StatusBar({ style }: Readonly<{ style?: string }>) {
  return <meta data-testid="status-bar" content={style} />;
}
