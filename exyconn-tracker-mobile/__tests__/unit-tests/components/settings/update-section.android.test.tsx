import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UpdateSection } from '../../../../src/components/settings/UpdateSection';
import { useUpdateState } from '../../../../src/hooks/useUpdateState';
import { openUpdate } from '../../../../src/tracker/updates';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo } from '../../mocks/react-native/apis';
import { getByA11yLabel } from '../state';

// UpdateSection reads the platform once, at import, so this file runs it as an Android build —
// one whose version the OS did not report.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../mocks/react-native/index')>();
  return { ...actual, Platform: { ...actual.Platform, OS: 'android' } };
});
vi.mock('expo-application', () => ({ nativeApplicationVersion: null }));
vi.mock('../../../../src/hooks/useUpdateState', () => ({ useUpdateState: vi.fn() }));
vi.mock('../../../../src/tracker/updates', () => ({
  checkForUpdate: vi.fn(() => Promise.resolve()),
  openUpdate: vi.fn(() => Promise.resolve()),
}));

describe('UpdateSection (Android)', () => {
  it('offers the newer build as a download, installed by Android’s own installer', () => {
    vi.mocked(useUpdateState).mockReturnValue({
      stage: 'available',
      version: '2.0.0',
      url: 'https://downloads.example.test/tracker.apk',
      lastCheckedAt: null,
    });
    renderWithProviders(<UpdateSection />);

    expect(getByA11yLabel('Download version 2.0.0')).toBeInTheDocument();
    expect(screen.getByTestId('icon-download')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A phone never updates itself: Android asks you before installing a new version.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(openUpdate).toHaveBeenCalledTimes(1);
  });

  it('shows a dash for a version the OS did not report', () => {
    vi.mocked(useUpdateState).mockReturnValue({
      stage: 'idle',
      version: '',
      url: '',
      lastCheckedAt: null,
    });
    renderWithProviders(<UpdateSection />);

    expect(screen.getByText('This phone runs version —.')).toBeInTheDocument();
  });

  it('leaves the live region to TalkBack instead of announcing', () => {
    vi.mocked(useUpdateState).mockReturnValue({
      stage: 'checking',
      version: '',
      url: '',
      lastCheckedAt: null,
    });
    const { rerender } = renderWithProviders(<UpdateSection />);

    vi.mocked(useUpdateState).mockReturnValue({
      stage: 'failed',
      version: '',
      url: '',
      lastCheckedAt: null,
    });
    rerender(<UpdateSection />);

    expect(
      screen.getByText('The last check could not reach the update service.'),
    ).toBeInTheDocument();
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });
});
