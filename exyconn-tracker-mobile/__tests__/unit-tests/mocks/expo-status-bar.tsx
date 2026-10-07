/**
 * `expo-status-bar`: renders a marker carrying the chosen style. A plain element, not `<meta>`,
 * which React 19 hoists into `document.head`, out of reach of `screen` queries.
 */
export function StatusBar({ style }: Readonly<{ style?: string }>) {
  return <div data-testid="status-bar" data-style={style} />;
}
