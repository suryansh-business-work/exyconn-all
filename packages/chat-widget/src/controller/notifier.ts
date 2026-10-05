import { chime } from '../sound';
import type { Store } from '../store/state';
import { isReply } from '../store/threads';
import { strings } from '../strings';
import type { ChatMessage } from '../types';

export interface Notifier {
  /** A message from the team, the bot or the system arrived. */
  incoming(message: Readonly<ChatMessage>): void;
  /** Whether the visitor can see the panel right now. */
  seeing(): boolean;
  dispose(): void;
}

const PREVIEW_LENGTH = 140;

/**
 * Tells the visitor about replies: read receipts when they are looking, otherwise the unread
 * badge, a chime when sound is on, and a "(n) " prefix on the page title while the tab is
 * hidden. Every new message is also read out through the panel's live region.
 */
export function createNotifier(
  store: Store,
  markRead: () => void,
  announce: (text: string) => void,
): Notifier {
  let hiddenCount = 0;
  let baseTitle = '';

  const seeing = (): boolean => store.get().open && document.visibilityState === 'visible';

  const restoreTitle = (): void => {
    if (hiddenCount > 0) {
      document.title = baseTitle;
      hiddenCount = 0;
    }
  };

  const onVisible = (): void => {
    if (document.visibilityState !== 'visible') {
      return;
    }
    restoreTitle();
    if (store.get().open && store.get().unread > 0) {
      store.set({ unread: 0 });
      markRead();
    }
  };

  const flagHidden = (): void => {
    if (document.visibilityState === 'visible') {
      return;
    }
    if (hiddenCount === 0) {
      baseTitle = document.title;
    }
    hiddenCount += 1;
    document.title = `(${hiddenCount}) ${baseTitle}`;
  };

  document.addEventListener('visibilitychange', onVisible);
  globalThis.addEventListener('focus', onVisible);

  return {
    seeing,
    incoming(message) {
      announce(strings.newMessageFrom(message.senderName, message.body.slice(0, PREVIEW_LENGTH)));
      if (!isReply(message)) {
        return;
      }
      if (seeing()) {
        markRead();
        return;
      }
      store.set({ unread: store.get().unread + 1 });
      if (store.get().soundOn) {
        chime();
      }
      flagHidden();
    },
    dispose() {
      restoreTitle();
      document.removeEventListener('visibilitychange', onVisible);
      globalThis.removeEventListener('focus', onVisible);
    },
  };
}
