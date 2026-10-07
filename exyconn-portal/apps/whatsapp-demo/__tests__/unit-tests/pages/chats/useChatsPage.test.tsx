import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import type { ChatMessage } from '@exyconn/wa-flow';
import { useChatsPage } from '../../../../src/pages/chats/useChatsPage';
import { renderHookWithProviders, useCurrentUrl } from '../../test-utils';

const deps = vi.hoisted(() => ({
  user: {
    id: 'u-1',
    fullName: 'Asha Nair',
    firstName: 'Asha',
    email: 'asha@example.com',
    phone: '',
  },
  bundles: new Map<string, unknown>(),
  sessionId: vi.fn(() => 's-1'),
  aiSession: '',
  read: vi.fn(),
  track: vi.fn(),
  contextArgs: [] as unknown[],
  context: vi.fn(() => ({ t: (source: string) => `T:${source}` })),
  runtimeOptions: undefined as undefined | Record<string, unknown>,
  runtime: { store: {}, open: vi.fn(), send: vi.fn(), choose: vi.fn(), clear: vi.fn() },
}));

vi.mock('../../../../src/hooks/useDemoUser', () => ({ useDemoUser: () => deps.user }));
vi.mock('../../../../src/hooks/useCatalog', () => ({
  useCatalog: () => ({ bundles: deps.bundles, loading: false }),
}));
vi.mock('../../../../src/analytics/session', () => ({ sessionId: deps.sessionId }));
vi.mock('../../../../src/hooks/useAiParse', () => ({
  useAiParse: (session: string) => {
    deps.aiSession = session;
    return { configured: true, read: deps.read };
  },
}));
vi.mock('../../../../src/analytics/useDemoAnalytics', () => ({
  useDemoAnalytics: () => deps.track,
}));
vi.mock('../../../../src/hooks/useEngineContext', () => ({
  useEngineContext: (...args: unknown[]) => {
    deps.contextArgs = args;
    return deps.context;
  },
}));
vi.mock('../../../../src/runtime/useChatRuntime', () => ({
  useChatRuntime: (options: Record<string, unknown>) => {
    deps.runtimeOptions = options;
    return deps.runtime;
  },
}));
vi.mock('../../../../src/components/wa/list/preview', () => ({
  previewOf: (message: ChatMessage, t: (source: string) => string) => t(`preview of ${message.id}`),
}));

const PATH = '/whatsapp-demo/:demoKey?';

function renderPage(route = '/whatsapp-demo/clinic') {
  return renderHookWithProviders(() => ({ page: useChatsPage(), url: useCurrentUrl() }), {
    route,
    path: PATH,
  });
}

const option = {
  id: 'book',
  title: 'Book',
  ref: { workflow: '$menu', node: '$menu', handle: 'book' },
};

beforeEach(() => {
  deps.bundles = new Map([['clinic', { revision: 'r1' }]]);
  deps.sessionId.mockClear();
  for (const fn of [
    deps.runtime.open,
    deps.runtime.send,
    deps.runtime.choose,
    deps.runtime.clear,
  ]) {
    fn.mockReset();
  }
});

describe('useChatsPage', () => {
  it('runs the viewer’s chats with their id, the catalog, analytics and the AI reader', () => {
    renderPage();
    expect(deps.aiSession).toBe('s-1');
    expect(deps.contextArgs).toEqual([deps.user, true]);
    expect(deps.runtimeOptions).toMatchObject({
      bundles: deps.bundles,
      context: deps.context,
      storageUserId: 'u-1',
      seedText: 'u-1',
      activeKey: 'clinic',
      track: deps.track,
      parse: deps.read,
    });
  });

  it('keeps one analytics session for the life of the screen', () => {
    const { rerender } = renderPage();
    rerender();
    expect(deps.sessionId).toHaveBeenCalledTimes(1);
  });

  it('opens the chat in the address once its demo is in the catalog', () => {
    deps.bundles = new Map();
    const { rerender } = renderPage();
    expect(deps.runtime.open).not.toHaveBeenCalled();
    deps.bundles = new Map([['clinic', { revision: 'r1' }]]);
    rerender();
    expect(deps.runtime.open).toHaveBeenCalledWith('clinic');
  });

  it('opens nothing and ignores chat actions on the bare chats screen', () => {
    const { result } = renderPage('/whatsapp-demo');
    expect(result.current.page.demoKey).toBeUndefined();
    result.current.page.send('hi');
    result.current.page.choose(option, 'Menu');
    result.current.page.clear();
    expect(deps.runtime.open).not.toHaveBeenCalled();
    expect(deps.runtime.send).not.toHaveBeenCalled();
    expect(deps.runtime.choose).not.toHaveBeenCalled();
    expect(deps.runtime.clear).not.toHaveBeenCalled();
  });

  it('sends, chooses and clears in the open chat', () => {
    const { result } = renderPage();
    result.current.page.send('hi');
    result.current.page.choose(option, 'Menu');
    result.current.page.clear();
    expect(deps.runtime.send).toHaveBeenCalledWith('clinic', 'hi');
    expect(deps.runtime.choose).toHaveBeenCalledWith('clinic', option, 'Menu');
    expect(deps.runtime.clear).toHaveBeenCalledWith('clinic');
  });

  it('navigates to a chat and back to the list', () => {
    const { result } = renderPage();
    act(() => result.current.page.openChat('salon'));
    expect(result.current.url).toBe('/whatsapp-demo/salon');
    act(() => result.current.page.back());
    expect(result.current.url).toBe('/whatsapp-demo');
  });

  it('announces a message that arrived elsewhere, in the viewer’s language, until dismissed', () => {
    const { result } = renderPage();
    const onArrived = deps.runtimeOptions?.onArrived as (key: string, message: ChatMessage) => void;
    const message: ChatMessage = {
      id: 'm7',
      from: 'bot',
      at: 0,
      content: { type: 'text', text: 'Reminder' },
    };
    act(() => onArrived('salon', message));
    expect(result.current.page.toast).toEqual({
      id: 'm7',
      demoKey: 'salon',
      text: 'T:preview of m7',
    });
    act(() => result.current.page.setToast(null));
    expect(result.current.page.toast).toBeNull();
  });
});
