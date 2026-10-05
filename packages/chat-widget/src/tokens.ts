/**
 * Every colour, radius, shadow and font the widget paints with. Each value is any CSS value —
 * a site may pass `var(--color-primary)` so the widget follows its own light/dark switch
 * (custom properties inherit through the shadow boundary). The defaults meet WCAG AA:
 * text on its surface ≥ 4.5:1, `onPrimary` on `primary` ≥ 4.5:1.
 */
export interface ChatTheme {
  /** Launcher, send button, active tab, links. */
  primary: string;
  onPrimary: string;
  /** Panel background. */
  surface: string;
  /** Agent/bot bubbles, inputs' resting fill, banners. */
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  /** The visitor's own bubbles. */
  visitorBubble: string;
  onVisitorBubble: string;
  agentBubble: string;
  onAgentBubble: string;
  /** Status dot when the team is online / offline (non-text, 3:1). */
  online: string;
  offline: string;
  /** Error banner and destructive confirm fill, with its ink. */
  danger: string;
  onDanger: string;
  focus: string;
  shadow: string;
  radius: string;
  radiusBubble: string;
  radiusControl: string;
  fontFamily: string;
  zIndex: string;
}

export const defaultChatTheme: Readonly<ChatTheme> = {
  primary: '#1d4ed8',
  onPrimary: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#475569',
  border: '#cbd5e1',
  visitorBubble: '#1d4ed8',
  onVisitorBubble: '#ffffff',
  agentBubble: '#f1f5f9',
  onAgentBubble: '#0f172a',
  online: '#16a34a',
  offline: '#64748b',
  danger: '#b91c1c',
  onDanger: '#ffffff',
  focus: '#1d4ed8',
  shadow: '0 16px 40px rgba(15, 23, 42, 0.22)',
  radius: '16px',
  radiusBubble: '14px',
  radiusControl: '10px',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  zIndex: '2147483000',
};

const kebab = (key: string): string => key.replaceAll(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/** The theme as `--cw-*` custom property declarations for `:host`. */
export function themeDeclarations(theme: Partial<ChatTheme> = {}): string {
  const merged: ChatTheme = { ...defaultChatTheme, ...theme };
  return Object.entries(merged)
    .map(([key, value]) => '--cw-' + kebab(key) + ': ' + value + ';')
    .join('\n');
}
