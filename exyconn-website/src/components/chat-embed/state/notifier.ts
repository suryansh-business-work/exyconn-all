import { chime } from "../lib/sound";
import type { ChatMessage } from "../types";
import type { Store } from "./state";
import { isReply } from "./threads";

export interface Notifier {
  /** A message from the team, the bot or the system arrived. */
  incoming(message: Readonly<ChatMessage>): void;
  /** Whether the visitor can see the panel right now. */
  seeing(): boolean;
  dispose(): void;
}

/**
 * Tells the visitor about replies: read receipts when they are looking, otherwise the unread
 * badge (mirrored into the host page's title by the loader), the launcher's nudge and a chime
 * when sound is on. Coming back to the tab with the panel open counts as seeing them.
 */
export function createNotifier(store: Store, markRead: () => void): Notifier {
  const seeing = (): boolean => store.get().open && document.visibilityState === "visible";

  const onVisible = (): void => {
    if (seeing() && store.get().unread > 0) {
      store.set({ unread: 0 });
      markRead();
    }
  };

  document.addEventListener("visibilitychange", onVisible);

  return {
    seeing,
    incoming(message) {
      if (!isReply(message)) {
        return;
      }
      if (seeing()) {
        markRead();
        return;
      }
      const { unread, nudges, soundOn } = store.get();
      store.set({ unread: unread + 1, nudges: nudges + 1 });
      if (soundOn) {
        chime();
      }
    },
    dispose() {
      document.removeEventListener("visibilitychange", onVisible);
    },
  };
}
