import { vi } from 'vitest';

/** Stand-ins for what the chats screen is built from, recording the props each one was given. */
interface StubBundle {
  demo: { key: string };
  revision: string;
}

interface ListProps {
  bundles: ReadonlyMap<string, StubBundle>;
  activeKey?: string;
  failed: boolean;
  onRetry: () => void;
  timeLabel: (ms: number) => string;
}

interface PaneProps {
  bundle: StubBundle;
  messages: readonly unknown[];
  typing: boolean;
}

interface ToastProps {
  toast: unknown;
  bundle?: StubBundle;
  onClose: () => void;
}

interface PageOptions {
  demoKey?: string;
  error?: Error;
  empty?: boolean;
  toast?: { id: string; demoKey: string; text: string };
}

export function makePage({ demoKey, error, empty = false, toast }: PageOptions = {}) {
  const bundles = new Map<string, StubBundle>(
    empty
      ? []
      : [
          ['clinic', { demo: { key: 'clinic' }, revision: 'r1' }],
          ['salon', { demo: { key: 'salon' }, revision: 'r1' }],
        ],
  );
  return {
    demoKey,
    user: { id: 'u-1', fullName: 'Asha Nair' },
    catalog: { bundles, loading: false, error, refetch: vi.fn().mockResolvedValue({}) },
    runtime: {
      store: {
        chats: { clinic: { messages: [{ id: 'm1' }], unread: 0 } },
        pending: [],
        typing: { clinic: true },
      },
    },
    track: vi.fn(),
    toast: toast ?? null,
    setToast: vi.fn(),
    openChat: vi.fn(),
    back: vi.fn(),
    send: vi.fn(),
    choose: vi.fn(),
    clear: vi.fn(),
  };
}

export const pageStubs = {
  page: makePage(),
  list: undefined as ListProps | undefined,
  pane: undefined as PaneProps | undefined,
  toast: undefined as ToastProps | undefined,
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
};

export const useChatsPageMock = { useChatsPage: () => pageStubs.page };

export const ChatListPaneMock = {
  ChatListPane: (props: Readonly<ListProps>) => {
    pageStubs.list = props;
    return <ul aria-label="chat list" />;
  },
};

export const ChatPaneMock = {
  ChatPane: (props: Readonly<PaneProps>) => {
    pageStubs.pane = props;
    return <section aria-label={`chat with ${props.bundle.demo.key}`} />;
  },
};

export const PushToastMock = {
  PushToast: (props: Readonly<ToastProps>) => {
    pageStubs.toast = props;
    return null;
  },
};
