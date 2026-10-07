import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateSection } from '../../../../src/components/settings/UpdateSection';
import { useUpdateState } from '../../../../src/hooks/useUpdateState';
import {
  checkForUpdate,
  openUpdate,
  type MobileUpdateState,
} from '../../../../src/tracker/updates';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo } from '../../mocks/react-native/apis';
import { getByA11yLabel } from '../state';

vi.mock('../../../../src/hooks/useUpdateState', () => ({ useUpdateState: vi.fn() }));
vi.mock('../../../../src/tracker/updates', () => ({
  checkForUpdate: vi.fn(() => Promise.resolve()),
  openUpdate: vi.fn(() => Promise.resolve()),
}));

function update(overrides: Partial<MobileUpdateState> = {}): MobileUpdateState {
  return { stage: 'idle', version: '', url: '', lastCheckedAt: null, ...overrides };
}

beforeEach(() => {
  vi.mocked(useUpdateState).mockReturnValue(update());
});

describe('UpdateSection (iPhone)', () => {
  it('says which version this phone runs and that it has not looked yet', () => {
    renderWithProviders(<UpdateSection />);

    expect(screen.getByText('This phone runs version 1.0.0.')).toBeInTheDocument();
    expect(screen.getByText('Not checked yet since this app started.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A phone never updates itself: iPhone builds are installed by your administrator.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('checks for a newer version on demand', () => {
    renderWithProviders(<UpdateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }));

    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('shows the check under way and blocks a second one', () => {
    vi.mocked(useUpdateState).mockReturnValue(update({ stage: 'checking' }));
    renderWithProviders(<UpdateSection />);

    expect(screen.getByText('Looking for a newer version…')).toBeInTheDocument();
    const check = screen.getByRole('button', { name: 'Check for updates' });
    expect(check).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(check);
    expect(checkForUpdate).not.toHaveBeenCalled();
  });

  it('offers the release page of a newer build', () => {
    vi.mocked(useUpdateState).mockReturnValue(update({ stage: 'available', version: '2.0.0' }));
    renderWithProviders(<UpdateSection />);

    expect(screen.getByText('Version 2.0.0 is available.')).toBeInTheDocument();
    expect(getByA11yLabel('Details version 2.0.0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(openUpdate).toHaveBeenCalledTimes(1);
  });

  it('says when the update service could not be reached', () => {
    vi.mocked(useUpdateState).mockReturnValue(update({ stage: 'failed' }));
    renderWithProviders(<UpdateSection />);

    expect(
      screen.getByText('The last check could not reach the update service.'),
    ).toBeInTheDocument();
  });

  it('tells VoiceOver how the check ended', () => {
    vi.mocked(useUpdateState).mockReturnValue(update({ stage: 'checking' }));
    const { rerender } = renderWithProviders(<UpdateSection />);

    vi.mocked(useUpdateState).mockReturnValue(update({ stage: 'available', version: '2.0.0' }));
    rerender(<UpdateSection />);

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Version 2.0.0 is available.',
    );
  });

  it('logs a check that could not be started', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Offline');
    vi.mocked(checkForUpdate).mockRejectedValueOnce(cause);
    renderWithProviders(<UpdateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }));

    await waitFor(() => expect(error).toHaveBeenCalledWith('Tracker action failed', cause));
  });
});
