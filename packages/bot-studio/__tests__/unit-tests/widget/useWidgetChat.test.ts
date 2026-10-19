import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { DemoProfile, WorkflowDef } from '@exyconn/wa-flow';
import { MENU } from '@exyconn/wa-flow/engine';
import type { CatalogBundle, RuntimeOptions } from '../../../src/runtime/types';
import { useLiveWidgetChat, usePreviewWidgetChat } from '../../../src/widget/useWidgetChat';

const rt = vi.hoisted(() => ({
  user: { id: 'u-1', firstName: 'Asha', fullName: 'Asha Nair', email: '', phone: '' },
  ai: { configured: true, read: vi.fn() },
  context: vi.fn(),
  track: vi.fn(),
  options: [] as unknown[],
  aiSessions: [] as string[],
  runtime: {
    store: { chats: {} as Record<string, unknown>, typing: {} as Record<string, boolean> },
    open: vi.fn(),
    send: vi.fn(),
    choose: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../../../src/runtime/useDemoUser', () => ({ useDemoUser: () => rt.user }));
vi.mock('../../../src/runtime/useAiParse', () => ({
  useAiParse: (session: string) => {
    rt.aiSessions.push(session);
    return rt.ai;
  },
}));
vi.mock('../../../src/runtime/useEngineContext', () => ({ useEngineContext: () => rt.context }));
vi.mock('../../../src/runtime/analytics/useDemoAnalytics', () => ({
  useDemoAnalytics: () => rt.track,
}));
vi.mock('../../../src/runtime/analytics/session', () => ({ sessionId: () => 'session-9' }));
vi.mock('../../../src/runtime/useChatRuntime', () => ({
  useChatRuntime: (options: unknown) => {
    rt.options.push(options);
    return rt.runtime;
  },
}));

function catalog(key = 'shop'): CatalogBundle {
  return {
    demo: { key, menuText: 'How can we help?' } as DemoProfile,
    workflows: [{ key: 'order', name: 'Place an order' } as WorkflowDef],
    revision: 'r1',
  };
}

const lastOptions = () => rt.options.at(-1) as RuntimeOptions;

beforeEach(() => {
  rt.user.id = 'u-1';
  rt.runtime.store = { chats: {}, typing: {} };
});

afterEach(() => {
  vi.clearAllMocks();
  rt.options.length = 0;
  rt.aiSessions.length = 0;
});

describe('useLiveWidgetChat', () => {
  it("saves the visitor's chat under the website scope, counts it and lets AI read it", () => {
    const bundles = new Map([['shop', catalog()]]);
    const { result } = renderHook(() => useLiveWidgetChat(bundles, 'shop'));
    expect(lastOptions()).toMatchObject({
      bundles,
      context: rt.context,
      storageUserId: 'website:u-1',
      seedText: 'u-1',
      activeKey: 'shop',
      track: rt.track,
      parse: rt.ai.read,
    });
    expect(rt.aiSessions.at(-1)).toBe('session-9');
    expect(rt.runtime.open).toHaveBeenCalledWith('shop');
    expect(result.current.aiConfigured).toBe(true);
    expect(result.current.user).toBe(rt.user);
  });

  it('keeps the chat in memory until the visitor has an id', () => {
    rt.user.id = '';
    renderHook(() => useLiveWidgetChat(new Map([['shop', catalog()]]), 'shop'));
    expect(lastOptions().storageUserId).toBeNull();
  });

  it('opens nothing and starts no workflow for a demo missing from the catalog', () => {
    const { result } = renderHook(() => useLiveWidgetChat(new Map(), 'ghost'));
    expect(rt.runtime.open).not.toHaveBeenCalled();
    expect(result.current.bundle).toBeUndefined();
    act(() => result.current.startWorkflow('order'));
    expect(rt.runtime.choose).not.toHaveBeenCalled();
  });

  it('reads the open chat from the store and empties it before the first message', () => {
    const bundles = new Map([['shop', catalog()]]);
    const { result, rerender } = renderHook(() => useLiveWidgetChat(bundles, 'shop'));
    expect(result.current.messages).toEqual([]);
    expect(result.current.typing).toBe(false);
    const messages = [{ id: 'm-1', from: 'bot', at: 0, content: { type: 'text', text: 'Hi' } }];
    rt.runtime.store = { chats: { shop: { messages } }, typing: { shop: true } };
    rerender();
    expect(result.current.messages).toBe(messages);
    expect(result.current.typing).toBe(true);
  });

  it('sends, chooses and restarts in its own demo', () => {
    const { result } = renderHook(() => useLiveWidgetChat(new Map([['shop', catalog()]]), 'shop'));
    const yes = { id: 'yes', title: 'Yes', ref: { workflow: 'a', node: 'b', handle: 'yes' } };
    act(() => {
      result.current.send('hello');
      result.current.choose(yes, 'Sure?');
      result.current.restart();
    });
    expect(rt.runtime.send).toHaveBeenCalledWith('shop', 'hello');
    expect(rt.runtime.choose).toHaveBeenCalledWith('shop', yes, 'Sure?');
    expect(rt.runtime.clear).toHaveBeenCalledWith('shop');
  });
});

describe('usePreviewWidgetChat', () => {
  it('plays the draft in memory with nothing counted, saved or tied to a visitor session', () => {
    const draft = catalog('draft');
    renderHook(() => usePreviewWidgetChat(draft));
    const options = lastOptions();
    expect(options.storageUserId).toBeNull();
    expect(options.track).toBeUndefined();
    expect(options.activeKey).toBe('draft');
    expect([...options.bundles.entries()]).toEqual([['draft', draft]]);
    expect(rt.aiSessions.at(-1)).toBe('editor-preview');
  });

  it('starts a workflow as if its row in the main menu was tapped', () => {
    const { result } = renderHook(() => usePreviewWidgetChat(catalog('draft')));
    act(() => result.current.startWorkflow('order'));
    expect(rt.runtime.choose).toHaveBeenCalledWith(
      'draft',
      { id: 'order', title: 'Place an order', ref: { workflow: MENU, node: MENU, handle: 'order' } },
      'How can we help?',
    );
  });

  it('ignores a workflow the draft does not have', () => {
    const { result } = renderHook(() => usePreviewWidgetChat(catalog('draft')));
    act(() => result.current.startWorkflow('missing'));
    expect(rt.runtime.choose).not.toHaveBeenCalled();
  });
});
