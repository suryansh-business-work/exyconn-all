import { fireEvent, render, screen } from '@testing-library/react';
import type { ThemeMode, TrackerStatus } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout, { ErrorBoundary } from '../../../src/app/(app)/_layout';
import { ScreenErrorBoundary } from '../../../src/components/shell/ScreenErrorBoundary';
import { useNotificationRouting } from '../../../src/hooks/useNotificationRouting';
import { useStatusMessage } from '../../../src/hooks/useStatusMessage';
import { useTrackerState } from '../../../src/hooks/useTrackerState';
import { NAV_ITEMS } from '../../../src/navigation/sections';
import { trackerState } from '../components/state';
import { tabsNavigation } from '../mocks/expo-router-tabs';

interface HeaderProps {
  title: string;
  status: TrackerStatus;
  user: { name: string } | null;
  themeMode: ThemeMode;
  onOpenAccount: () => void;
}

vi.mock('../../../src/hooks/useTrackerState', () => ({ useTrackerState: vi.fn() }));
vi.mock('../../../src/hooks/useNotificationRouting', () => ({ useNotificationRouting: vi.fn() }));
vi.mock('../../../src/hooks/useStatusMessage', () => ({ useStatusMessage: vi.fn() }));
vi.mock('../../../src/components/shell/ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: () => null,
}));
vi.mock('../../../src/components/shell/AppHeader', () => ({
  AppHeader: ({ title, status, user, themeMode, onOpenAccount }: Readonly<HeaderProps>) => (
    <div
      data-testid="app-header"
      data-title={title}
      data-status={status}
      data-user={user?.name ?? 'nobody'}
      data-theme={themeMode}
    >
      <button type="button" onClick={onOpenAccount}>
        Account
      </button>
    </div>
  ),
}));
vi.mock('../../../src/components/shell/TabBar', () => ({
  TabBar: ({ unreadMessages }: Readonly<{ unreadMessages: number }>) => (
    <div data-testid="tab-bar" data-unread={unreadMessages} />
  ),
}));

beforeEach(() => {
  vi.mocked(useTrackerState).mockReturnValue(trackerState());
});

describe('AppLayout', () => {
  it('holds the desktop’s five sections, each titled', () => {
    render(<AppLayout />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByTestId(`tab-screen-${item.id}`).dataset.title).toBe(item.label);
    }
  });

  it('titles the header after the section and shows the live status and user', () => {
    vi.mocked(useTrackerState).mockReturnValue(
      trackerState({
        status: 'tracking',
        preferences: { ...trackerState().preferences, themeMode: 'dark' },
      }),
    );
    render(<AppLayout />);
    const header = screen.getByTestId('app-header');
    expect(header.dataset.title).toBe('Dashboard');
    expect(header.dataset.status).toBe('tracking');
    expect(header.dataset.user).toBe('Asha Rao');
    expect(header.dataset.theme).toBe('dark');
  });

  it('falls back to an idle, signed-out-looking header before the first snapshot', () => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    render(<AppLayout />);
    const header = screen.getByTestId('app-header');
    expect(header.dataset.status).toBe('idle');
    expect(header.dataset.user).toBe('nobody');
    expect(header.dataset.theme).toBe('system');
    expect(screen.getByTestId('tab-bar').dataset.unread).toBe('0');
  });

  it('badges the tab bar with the unread messages', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ unreadMessages: 3 }));
    render(<AppLayout />);
    expect(screen.getByTestId('tab-bar').dataset.unread).toBe('3');
  });

  it('opens settings from the header’s account button', () => {
    render(<AppLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    expect(tabsNavigation.navigate).toHaveBeenCalledWith('settings');
  });

  it('announces the tracking status once, and routes notification taps', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'paused' }));
    render(<AppLayout />);
    expect(useStatusMessage).toHaveBeenCalledWith('Paused — nothing is being recorded');
    expect(useNotificationRouting).toHaveBeenCalled();
  });

  it('announces "not tracking" before the first snapshot', () => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    render(<AppLayout />);
    expect(useStatusMessage).toHaveBeenCalledWith('Not tracking — nothing is being recorded');
  });

  it('exports the screen error boundary', () => {
    expect(ErrorBoundary).toBe(ScreenErrorBoundary);
  });
});
