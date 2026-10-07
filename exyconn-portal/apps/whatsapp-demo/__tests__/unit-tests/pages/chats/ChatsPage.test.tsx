import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ChatsPage } from '../../../../src/pages/chats';
import { PHONE_WIDTH, stubMatchMedia } from '../../media';
import { renderWithProviders } from '../../test-utils';
import { makePage, pageStubs as seen } from './chats-page.stubs';

vi.mock(
  '../../../../src/pages/chats/useChatsPage',
  async () => (await import('./chats-page.stubs')).useChatsPageMock,
);
vi.mock('../../../../src/hooks/useWaFormat', () => ({
  useWaFormat: () => ({ time: (ms: number) => `time ${ms}`, date: (ms: number) => `date ${ms}` }),
}));
vi.mock('@exyconn/shell/logging/portalLogger', async () => ({
  portalLogger: (await import('./chats-page.stubs')).pageStubs.logger,
}));
vi.mock(
  '../../../../src/components/wa/list/ChatListPane',
  async () => (await import('./chats-page.stubs')).ChatListPaneMock,
);
vi.mock(
  '../../../../src/components/wa/chat/ChatPane',
  async () => (await import('./chats-page.stubs')).ChatPaneMock,
);
vi.mock('../../../../src/components/wa/chat/EmptyPane', () => ({
  EmptyPane: () => <p>No chat open</p>,
}));
vi.mock(
  '../../../../src/components/wa/chat/PushToast',
  async () => (await import('./chats-page.stubs')).PushToastMock,
);

beforeEach(() => {
  seen.page = makePage();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ChatsPage on a wide screen', () => {
  it('shows the chat list beside an empty pane when no chat is open', () => {
    renderWithProviders(<ChatsPage />);
    expect(screen.getByRole('list', { name: 'chat list' })).toBeInTheDocument();
    expect(screen.getByText('No chat open')).toBeInTheDocument();
    expect(seen.list).toMatchObject({
      bundles: seen.page.catalog.bundles,
      store: seen.page.runtime.store,
      activeKey: undefined,
      userName: 'Asha Nair',
      loading: false,
      failed: false,
      onOpen: seen.page.openChat,
    });
  });

  it('shows the open chat beside the list with its transcript and typing state', () => {
    seen.page = makePage({ demoKey: 'clinic' });
    renderWithProviders(<ChatsPage />);
    expect(screen.getByRole('list', { name: 'chat list' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'chat with clinic' })).toBeInTheDocument();
    expect(seen.pane).toMatchObject({
      messages: seen.page.runtime.store.chats.clinic.messages,
      typing: true,
      onSend: seen.page.send,
      onChoose: seen.page.choose,
      onClear: seen.page.clear,
      onBack: seen.page.back,
      onTrack: seen.page.track,
    });
  });

  it('opens an empty transcript, not typing, for a demo with no chat yet', () => {
    seen.page = makePage({ demoKey: 'salon' });
    renderWithProviders(<ChatsPage />);
    expect(seen.pane).toMatchObject({ messages: [], typing: false });
  });

  it('keeps the empty pane for a demo that is not in the catalog', () => {
    seen.page = makePage({ demoKey: 'ghost' });
    renderWithProviders(<ChatsPage />);
    expect(screen.getByText('No chat open')).toBeInTheDocument();
  });

  it('reports a failed catalog only when there is nothing cached to show', () => {
    seen.page = makePage({ error: new Error('offline'), empty: true });
    renderWithProviders(<ChatsPage />);
    expect(seen.list?.failed).toBe(true);
    seen.page = makePage({ error: new Error('offline') });
    renderWithProviders(<ChatsPage />);
    expect(seen.list?.failed).toBe(false);
  });

  it('retries the catalog, warning when the retry fails', async () => {
    const failure = new Error('offline');
    seen.page.catalog.refetch.mockRejectedValue(failure);
    renderWithProviders(<ChatsPage />);
    seen.list?.onRetry();
    expect(seen.page.catalog.refetch).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(seen.logger.warn).toHaveBeenCalledWith('wa-demo: catalog retry failed', failure);
    });
  });
});

describe('ChatsPage on a phone', () => {
  it('shows only the list when no chat is open', () => {
    stubMatchMedia(PHONE_WIDTH);
    renderWithProviders(<ChatsPage />);
    expect(screen.getByRole('list', { name: 'chat list' })).toBeInTheDocument();
    expect(screen.queryByText('No chat open')).not.toBeInTheDocument();
  });

  it('shows only the chat once one is open', () => {
    stubMatchMedia(PHONE_WIDTH);
    seen.page = makePage({ demoKey: 'clinic' });
    renderWithProviders(<ChatsPage />);
    expect(screen.getByRole('region', { name: 'chat with clinic' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'chat list' })).not.toBeInTheDocument();
  });
});

describe('ChatsPage list times and toast', () => {
  it('labels today by the time, yesterday by name and older days by the date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 6, 15, 0));
    renderWithProviders(<ChatsPage />, { messages: { Yesterday: 'Ayer' } });
    const today = new Date(2026, 9, 6, 9, 30).getTime();
    const older = new Date(2026, 9, 1, 9, 30).getTime();
    expect(seen.list?.timeLabel(today)).toBe(`time ${today}`);
    expect(seen.list?.timeLabel(new Date(2026, 9, 5, 20, 0).getTime())).toBe('Ayer');
    expect(seen.list?.timeLabel(older)).toBe(`date ${older}`);
  });

  it('has no business for the toast until a message arrives elsewhere', () => {
    renderWithProviders(<ChatsPage />);
    expect(seen.toast).toMatchObject({
      toast: null,
      bundle: undefined,
      onOpen: seen.page.openChat,
    });
  });

  it('names the business a message arrived from, and dismisses the toast on close', () => {
    seen.page = makePage({ toast: { id: 'm1', demoKey: 'clinic', text: 'Reminder' } });
    renderWithProviders(<ChatsPage />);
    expect(seen.toast?.bundle).toBe(seen.page.catalog.bundles.get('clinic'));
    seen.toast?.onClose();
    expect(seen.page.setToast).toHaveBeenCalledWith(null);
  });
});
