import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { useChatConsole, useChatFrames } from '../chat.context';
import { chatSessionPath } from '../chat.routes';
import { isLiveVisitorMessage } from '../chat.message';
import { playChime } from './chime';
import { notifyDesktop } from './desktopNotification';

/**
 * Rings and notifies for every new visitor message in a live thread, on whichever chat page is open, following
 * this browser's alert choices. Renders nothing.
 */
export function ChatAlerts() {
  const t = useT();
  const navigate = useNavigate();
  const { prefs } = useChatConsole();

  useChatFrames((frame) => {
    if (frame.t !== 'message' || !isLiveVisitorMessage(frame.message)) {
      return;
    }
    const { message } = frame;
    if (prefs.sound) {
      playChime();
    }
    if (prefs.desktop) {
      const body = message.body || t('Sent an attachment');
      notifyDesktop(
        t('New chat message from {name}', { name: message.senderName }),
        body,
        message.sessionId,
        () => navigate(chatSessionPath(message.sessionId)),
      );
    }
  });

  return null;
}
