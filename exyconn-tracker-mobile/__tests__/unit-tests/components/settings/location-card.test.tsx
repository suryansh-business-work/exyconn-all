import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { LOCATION_PURPOSE } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import * as Location from 'expo-location';
import { LocationCard } from '../../../../src/components/settings/LocationCard';
import { logger } from '../../../../src/tracker/logger';
import { renderWithProviders } from '../../test-utils';
import { AppState, Linking, rnTest } from '../../mocks/react-native/apis';

vi.mock('../../../../src/tracker/logger', () => ({ logger: { error: vi.fn() } }));

type Permission = Awaited<ReturnType<typeof Location.getForegroundPermissionsAsync>>;

const DENIED_ASK = { granted: false, canAskAgain: true, status: 'denied' } as Permission;
const DENIED_FINAL = { granted: false, canAskAgain: false, status: 'denied' } as Permission;

const TURN_ON = { name: 'Turn on' };

describe('LocationCard', () => {
  it('says why location is needed and that it is on, offering only the settings page', async () => {
    renderWithProviders(<LocationCard />);
    expect(screen.getByText(LOCATION_PURPOSE)).toBeInTheDocument();
    expect(screen.getByText('Checking…')).toBeInTheDocument();

    expect(await screen.findByText('The tracker can read where you are.')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.queryByRole('button', TURN_ON)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open location settings' }));
    await waitFor(() => expect(Linking.openSettings).toHaveBeenCalledTimes(1));
  });

  it('asks the OS when it will still prompt, then reads the answer again', async () => {
    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValueOnce(DENIED_ASK);
    renderWithProviders(<LocationCard />);
    expect(
      await screen.findByText('This app is not allowed to use your location.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', TURN_ON));

    expect(await screen.findByText('On')).toBeInTheDocument();
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it('opens this app’s settings when the OS will no longer prompt', async () => {
    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue(DENIED_FINAL);
    renderWithProviders(<LocationCard />);
    fireEvent.click(await screen.findByRole('button', TURN_ON));

    await waitFor(() => expect(Linking.openSettings).toHaveBeenCalledTimes(1));
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('offers no Turn on when the phone’s location services are off', async () => {
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(false);
    renderWithProviders(<LocationCard />);
    expect(
      await screen.findByText('Location services are turned off on this device.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', TURN_ON)).toBeNull();
  });

  it('reads again when the app comes back to the foreground, not when it leaves', async () => {
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValueOnce(false);
    const { unmount } = renderWithProviders(<LocationCard />);
    await screen.findByText('Off');

    act(() => rnTest.appState('background'));
    expect(Location.hasServicesEnabledAsync).toHaveBeenCalledTimes(1);

    act(() => rnTest.appState('active'));
    expect(await screen.findByText('On')).toBeInTheDocument();
    expect(Location.hasServicesEnabledAsync).toHaveBeenCalledTimes(2);

    unmount();
    rnTest.appState('active');
    expect(Location.hasServicesEnabledAsync).toHaveBeenCalledTimes(2);
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('shows location off, and logs why, when the check itself fails', async () => {
    const cause = new Error('module missing');
    vi.mocked(Location.hasServicesEnabledAsync).mockRejectedValueOnce(cause);
    renderWithProviders(<LocationCard />);

    expect(await screen.findByText(/^No location could be read\./)).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith('Checking location access failed', cause);
  });

  it('never leaves a rejection unhandled, even when logging the failure fails', async () => {
    const failure = new Error('log queue full');
    vi.mocked(Location.hasServicesEnabledAsync).mockRejectedValueOnce(new Error('missing'));
    vi.mocked(logger.error).mockImplementationOnce(() => {
      throw failure;
    });
    renderWithProviders(<LocationCard />);

    await waitFor(() =>
      expect(logger.error).toHaveBeenLastCalledWith('Checking location access failed', failure),
    );
    expect(logger.error).toHaveBeenCalledTimes(2);
  });
});
