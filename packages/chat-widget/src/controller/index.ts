import { ChatSocket } from '../socket';
import { primeAudio } from '../sound';
import { readItem, storageKeys, writeItem } from '../storage';
import { failPending, withStatus } from '../store/threads';
import type { Store, Tab, ThreadItem } from '../store/state';
import { strings } from '../strings';
import { downloadTranscript } from '../transcript';
import type { Channel, ChatSite, ClientFrame, Identity, OutgoingFile } from '../types';
import { handleFrame } from './frames';
import { createNotifier } from './notifier';
import { optimisticItem, sendFrame } from './outgoing';

export interface ChatActions {
  open(): void;
  close(): void;
  selectTab(tab: Tab): void;
  requestCode(identity: Readonly<Identity>): void;
  resendCode(): void;
  verifyCode(code: string): void;
  changeEmail(): void;
  send(channel: Channel, body: string, files: OutgoingFile[]): void;
  retry(channel: Channel, key: string): void;
  /** A keystroke in the live composer: typing on now, off after 3 s of quiet. */
  typed(): void;
  stopTyping(): void;
  endChat(): void;
  newChat(): void;
  toggleSound(): void;
  dismissError(): void;
  dismissNotice(): void;
  download(): void;
  showError(message: string): void;
}

export interface ChatController {
  actions: ChatActions;
  dispose(): void;
}

const TYPING_IDLE_MS = 3_000;
const MAX_PAGE_URL = 500;

const pageUrl = (): string => globalThis.location.href.slice(0, MAX_PAGE_URL);

export function createController(
  store: Store,
  config: Readonly<{ socketUrl: string; site: ChatSite; root: ShadowRoot }>,
  announce: (text: string) => void,
): ChatController {
  const keys = storageKeys(config.site);
  let typingOn = false;
  let typingTimer: ReturnType<typeof setTimeout> | undefined;

  const socket = new ChatSocket(config.socketUrl, {
    hello: () => {
      const token = readItem(keys.token) ?? undefined;
      return { t: 'hello', role: 'visitor', site: config.site, token };
    },
    onFrame: (frame) => handleFrame({ store, keys, notifier, markRead }, frame),
    onStatus: (connection) => {
      const patch =
        connection === 'open' ? {} : { busy: false, threads: failPending(store.get().threads) };
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
    socket.send({ t: 'read' });
  };
  const notifier = createNotifier(store, markRead, announce);
  const chatOpen = (): boolean => store.get().session?.status === 'OPEN';

  const setTyping = (on: boolean): void => {
    clearTimeout(typingTimer);
    if (typingOn !== on && chatOpen()) {
      socket.send({ t: 'typing', on });
    }
    typingOn = on;
  };

  const transmit = (channel: Channel, item: Readonly<ThreadItem>): void => {
    if (!socket.send(sendFrame(channel, item))) {
      const items = withStatus(store.get().threads[channel], item.key, 'failed');
      store.set({ threads: { ...store.get().threads, [channel]: items } });
    }
  };

  const actions: ChatActions = {
    open() {
      primeAudio();
      socket.connect();
      const { unread, step } = store.get();
      store.set({ open: true, unread: 0 });
      if (unread > 0 && step === 'signedIn') {
        markRead();
      }
    },
    close: () => store.set({ open: false }),
    selectTab: (tab) => store.set({ tab }),
    requestCode(identity) {
      if (sendOrSay({ t: 'requestCode', ...identity, pageUrl: pageUrl() })) {
        store.set({ identity: { ...identity }, busy: true, error: '' });
      }
    },
    resendCode: () => actions.requestCode(store.get().identity),
    verifyCode(code) {
      if (sendOrSay({ t: 'verifyCode', ...store.get().identity, pageUrl: pageUrl(), code })) {
        store.set({ busy: true, error: '' });
      }
    },
    changeEmail: () => store.set({ step: 'form', error: '' }),
    send(channel, body, files) {
      const state = store.get();
      const item = optimisticItem(channel, body, files, state.session);
      store.set({ threads: { ...state.threads, [channel]: [...state.threads[channel], item] } });
      setTyping(false);
      transmit(channel, item);
    },
    retry(channel, key) {
      const items = withStatus(store.get().threads[channel], key, 'sending');
      store.set({ threads: { ...store.get().threads, [channel]: items }, error: '' });
      const item = items.find((candidate) => candidate.key === key);
      if (item) {
        transmit(channel, item);
      }
    },
    typed() {
      setTyping(true);
      typingTimer = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
    },
    stopTyping: () => setTyping(false),
    endChat: () => {
      sendOrSay({ t: 'end' });
    },
    newChat: () => {
      sendOrSay({ t: 'newChat' });
    },
    toggleSound() {
      const soundOn = !store.get().soundOn;
      writeItem(keys.sound, soundOn ? 'on' : 'off');
      store.set({ soundOn });
    },
    dismissError: () => store.set({ error: '' }),
    dismissNotice: () => store.set({ notice: '' }),
    download() {
      const { session, threads } = store.get();
      if (session) {
        downloadTranscript(session, threads, config.root);
      }
    },
    showError: (message) => store.set({ error: message }),
  };

  // A returning visitor connects at once, so replies sent while they were away arrive.
  if (readItem(keys.token)) {
    socket.connect();
  }

  return {
    actions,
    dispose() {
      clearTimeout(typingTimer);
      notifier.dispose();
      socket.dispose();
    },
  };
}
