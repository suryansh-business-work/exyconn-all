import { act, fireEvent, screen } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { UpdateBanner } from '../../../../src/components/shell/UpdateBanner';
import { openUpdate, type MobileUpdateState } from '../../../../src/tracker/updates';
import { Platform } from '../../mocks/react-native/apis';
import { renderWithProviders } from '../../test-utils';

const store = vi.hoisted(() => {
  let state: unknown = { stage: 'idle', version: '', url: '', lastCheckedAt: null };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    publish(next: unknown) {
      state = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
});

vi.mock('../../../../src/tracker/updates', () => ({
  subscribeUpdate: (listener: () => void) => store.subscribe(listener),
  getUpdate: () => store.get(),
  openUpdate: vi.fn(() => Promise.resolve()),
}));

const IDLE: MobileUpdateState = { stage: 'idle', version: '', url: '', lastCheckedAt: null };
const AVAILABLE: MobileUpdateState = {
  stage: 'available',
  version: '2.1.0',
  url: 'https://example.test/release',
  lastCheckedAt: '2026-09-11T10:00:00.000Z',
};
const MESSAGE = 'Exyconn Tracker 2.1.0 is available.';

describe('UpdateBanner', () => {
  it('stays out of the way while there is nothing newer', () => {
    act(() => store.publish(IDLE));
    renderWithProviders(<UpdateBanner />);
    expect(screen.queryByText(/is available/)).not.toBeInTheDocument();
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  it('names the newer version, announces it, and opens the release page on iOS', () => {
    act(() => store.publish(AVAILABLE));
    renderWithProviders(<UpdateBanner />);
    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(MESSAGE);
    fireEvent.click(screen.getByRole('link', { name: 'Details' }));
    expect(openUpdate).toHaveBeenCalledTimes(1);
  });

  it('offers the download itself on Android', () => {
    Platform.OS = 'android';
    act(() => store.publish(AVAILABLE));
    renderWithProviders(<UpdateBanner />);
    fireEvent.click(screen.getByRole('link', { name: 'Download' }));
    expect(openUpdate).toHaveBeenCalledTimes(1);
  });

  it('appears as soon as a check finds a newer build', () => {
    act(() => store.publish(IDLE));
    renderWithProviders(<UpdateBanner />);
    act(() => store.publish(AVAILABLE));
    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
  });
});
