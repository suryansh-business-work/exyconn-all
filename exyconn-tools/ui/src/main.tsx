import React from 'react';
import ReactDOM from 'react-dom/client';
import { mountChatWidget } from '@exyconn/chat-widget';
import App from './App';
import { ORGANIZATION } from './shared/seo/site';
import { createAppTheme } from './shared/theme/createAppTheme';
import { fonts, radii } from './shared/theme/tokens';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/** The visitor chat bubble, coloured from the light tools palette. Browser only (not prerendered). */
function mountChat(): void {
  const socketUrl = import.meta.env.VITE_CHAT_SOCKET_URL;
  if (!socketUrl) {
    console.warn('[chat-widget] VITE_CHAT_SOCKET_URL is not set; the chat is not shown.');
    return;
  }
  const { palette } = createAppTheme('light');
  mountChatWidget({
    socketUrl,
    site: 'TOOLS',
    privacyUrl: `${ORGANIZATION.url}/privacy-policy`,
    theme: {
      primary: palette.primary.main,
      onPrimary: palette.primary.contrastText,
      surface: palette.background.paper,
      surfaceMuted: palette.background.default,
      text: palette.text.primary,
      textMuted: palette.text.secondary,
      border: palette.divider,
      visitorBubble: palette.primary.main,
      onVisitorBubble: palette.primary.contrastText,
      agentBubble: palette.background.default,
      onAgentBubble: palette.text.primary,
      online: palette.success.main,
      offline: palette.grey[600],
      danger: palette.error.dark,
      onDanger: palette.error.contrastText,
      focus: palette.primary.main,
      radius: radii.card,
      radiusControl: radii.control,
      fontFamily: fonts.sans,
    },
  });
}

mountChat();
