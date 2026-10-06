import { ChatSocket } from "../lib/socket";
import { primeAudio } from "../lib/sound";
import { readItem, storageKeys, writeItem } from "../lib/storage";
import { downloadTranscript } from "../lib/transcript";
import { strings } from "../strings";
import type { Channel, ChatSite, ClientFrame, Identity, OutgoingFile } from "../types";
import { handleFrame } from "./frames";
import { createNotifier } from "./notifier";
import { optimisticItem, sendFrame } from "./outgoing";
import { createStore, initialState, type Store, type ThreadItem } from "./state";
import { failPending, withStatus } from "./threads";

export interface ChatActions {
  open(): void;
  close(): void;
  requestCode(identity: Readonly<Identity>): void;
  resendCode(): void;
  verifyCode(code: string): void;
  changeEmail(): void;
  send(channel: Channel, body: string, files: OutgoingFile[]): void;
  retry(channel: Channel, key: string): void;
  discard(channel: Channel, key: string): void;
  /** A keystroke in the live composer: typing on now, off after 3 s of quiet. */
  typed(): void;
  stopTyping(): void;
  rate(messageId: string, helpful: boolean): void;
  endChat(): void;
  newChat(): void;
  setSound(on: boolean): void;
  showError(message: string): void;
  dismissError(): void;
  download(): void;
  /** The host page the visitor is on, recorded with the session when they sign in. */
  setPageUrl(url: string): void;
}

export interface ChatController {
  store: Store;
  actions: ChatActions;
  dispose(): void;
}

const TYPING_IDLE_MS = 3_000;
/** The server's CHAT_LIMITS.pageUrl. */
const MAX_PAGE_URL = 500;

/**
 * Everything the chat does that is not drawing: the socket, the state it feeds and the
 * actions the components call. Plain TypeScript, read by React through `useChat`.
 */
export function createChatController(socketUrl: string, site: ChatSite): ChatController {
  const keys = storageKeys(site);
  const store = createStore(initialState(false));
  let pageUrl = document.referrer.slice(0, MAX_PAGE_URL);
  let typingOn = false;
  let typingTimer: ReturnType<typeof setTimeout> | undefined;

  const socket = new ChatSocket(socketUrl, {
    hello: () => ({ t: "hello", role: "visitor", site, token: readItem(keys.token) ?? undefined }),
    onFrame: (frame) => handleFrame({ store, keys, notifier, markRead }, frame),
    onStatus: (connection) => {
      const patch =
        connection === "open" ? {} : { busy: false, threads: failPending(store.get().threads) };
      store.set({ connection, ...patch });
    },
  });

  /** Sends, or tells the visitor the socket is not ready; true when it went out. */
  const sendOrSay = (frame: ClientFrame): boolean => {
    const sent = socket.send(frame);
    if (!sent) {
      store.set({ error: strings.notConnected, busy: false });
    }
    return sent;
  };
  const markRead = (): void => {
    socket.send({ t: "read" });
  };
  const notifier = createNotifier(store, markRead);
  const chatOpen = (): boolean => store.get().session?.status === "OPEN";
  const patchThread = (channel: Channel, items: ThreadItem[]): void => {
    store.set({ threads: { ...store.get().threads, [channel]: items } });
  };

  const setTyping = (on: boolean): void => {
    clearTimeout(typingTimer);
    if (typingOn !== on && chatOpen()) {
      socket.send({ t: "typing", on });
    }
    typingOn = on;
  };

  const transmit = (channel: Channel, item: Readonly<ThreadItem>): void => {
    if (!socket.send(sendFrame(item))) {
      patchThread(channel, withStatus(store.get().threads[channel], item.key, "failed"));
    }
  };

  const actions: ChatActions = {
    open() {
      primeAudio();
      socket.connect();
      const { unread, step } = store.get();
      store.set({ open: true, unread: 0 });
      if (unread > 0 && step === "signedIn") {
        markRead();
      }
    },
    close: () => store.set({ open: false }),
    requestCode(identity) {
      if (sendOrSay({ t: "requestCode", ...identity, pageUrl })) {
        store.set({ identity: { ...identity }, busy: true, error: "" });
      }
    },
    resendCode: () => actions.requestCode(store.get().identity),
    verifyCode(code) {
      if (sendOrSay({ t: "verifyCode", ...store.get().identity, pageUrl, code })) {
        store.set({ busy: true, error: "" });
      }
    },
    changeEmail: () => store.set({ step: "form", error: "" }),
    send(channel, body, files) {
      const state = store.get();
      const item = optimisticItem(channel, body, files, state.session);
      patchThread(channel, [...state.threads[channel], item]);
      if (channel === "LIVE") {
        setTyping(false);
      }
      transmit(channel, item);
    },
    retry(channel, key) {
      const items = withStatus(store.get().threads[channel], key, "sending");
      patchThread(channel, items);
      const item = items.find((candidate) => candidate.key === key);
      if (item) {
        transmit(channel, item);
      }
    },
    discard(channel, key) {
      patchThread(
        channel,
        store.get().threads[channel].filter((item) => item.key !== key)
      );
    },
    typed() {
      setTyping(true);
      typingTimer = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
    },
    stopTyping: () => setTyping(false),
    rate(messageId, helpful) {
      sendOrSay({ t: "feedback", messageId, helpful });
    },
    endChat: () => {
      sendOrSay({ t: "end" });
    },
    newChat: () => {
      sendOrSay({ t: "newChat" });
    },
    setSound(soundOn) {
      writeItem(keys.sound, soundOn ? "on" : "off");
      store.set({ soundOn });
    },
    showError: (message) => store.set({ error: message }),
    dismissError: () => store.set({ error: "" }),
    download() {
      const { session, threads } = store.get();
      if (session) {
        downloadTranscript(session, threads);
      }
    },
    setPageUrl(url) {
      pageUrl = url.slice(0, MAX_PAGE_URL);
    },
  };

  // A returning visitor connects at once, so replies sent while they were away arrive.
  if (readItem(keys.token)) {
    socket.connect();
  }

  return {
    store,
    actions,
    dispose() {
      clearTimeout(typingTimer);
      notifier.dispose();
      socket.dispose();
    },
  };
}
