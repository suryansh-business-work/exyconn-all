import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE_CHAT_ID, useWebsiteDemo } from '../../../src/pages/website-chat/useWebsiteDemo';
import { site } from '../fixtures';
import { renderHookWithProviders, useCurrentPath } from '../test-utils';

const mocks = vi.hoisted(() => ({
  useCatalog: vi.fn(),
  useLiveWidgetChat: vi.fn(),
  startWorkflow: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock('@exyconn/bot-studio/runtime', () => ({ useCatalog: mocks.useCatalog }));
vi.mock('@exyconn/bot-studio/widget', () => ({ useLiveWidgetChat: mocks.useLiveWidgetChat }));

const ADVISORY = site('advisory');
const STORE = site('store');

function serve(sites: ReturnType<typeof site>[]) {
  const bundles = new Map(sites.map((entry) => [entry.demo.key, entry]));
  mocks.useCatalog.mockReturnValue({
    bundles,
    loading: false,
    error: undefined,
    refetch: mocks.refetch,
  });
  return bundles;
}

function open(route = '/') {
  return renderHookWithProviders(() => ({ demo: useWebsiteDemo(), path: useCurrentPath() }), {
    route,
    path: '/:demoKey?',
  });
}

describe('the demo websites', () => {
  beforeEach(() => {
    mocks.useLiveWidgetChat.mockReturnValue({ startWorkflow: mocks.startWorkflow, bundle: null });
  });
  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it("reads the website channel's demos and opens the first by default", () => {
    const bundles = serve([ADVISORY, STORE]);
    const { result } = open();
    expect(mocks.useCatalog).toHaveBeenCalledWith('website');
    expect(result.current.demo.sites).toEqual([ADVISORY, STORE]);
    expect(result.current.demo.current).toBe(ADVISORY);
    expect(mocks.useLiveWidgetChat).toHaveBeenCalledWith(bundles, 'advisory');
    expect(result.current.demo.retry).toBe(mocks.refetch);
  });

  it('opens the site named in the address, and the first for an unknown name', () => {
    serve([ADVISORY, STORE]);
    expect(open('/store').result.current.demo.current).toBe(STORE);
    expect(open('/nowhere').result.current.demo.current).toBe(ADVISORY);
  });

  it('chats with no site while none is published', () => {
    serve([]);
    const { result } = open();
    expect(result.current.demo.current).toBeUndefined();
    expect(mocks.useLiveWidgetChat).toHaveBeenCalledWith(expect.any(Map), '');
  });

  it('moves to a picked site in the address', () => {
    serve([ADVISORY, STORE]);
    const { result } = open();
    act(() => result.current.demo.pickSite('store'));
    expect(result.current.path).toBe('/store');
    expect(result.current.demo.current).toBe(STORE);
  });

  it('starts a workflow and scrolls the live chat into view', () => {
    serve([ADVISORY]);
    const chat = document.createElement('div');
    chat.id = LIVE_CHAT_ID;
    chat.scrollIntoView = vi.fn();
    document.body.append(chat);
    const { result } = open();
    act(() => result.current.demo.tryWorkflow('quote'));
    expect(mocks.startWorkflow).toHaveBeenCalledWith('quote');
    expect(chat.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('starts a workflow even when the live chat is not on the page', () => {
    serve([ADVISORY]);
    const { result } = open();
    act(() => result.current.demo.tryWorkflow('quote'));
    expect(mocks.startWorkflow).toHaveBeenCalledWith('quote');
  });
});
