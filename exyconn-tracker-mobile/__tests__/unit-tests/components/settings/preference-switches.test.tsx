import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptureSoundPreference } from '../../../../src/components/settings/CaptureSoundPreference';
import { TransparencyPreference } from '../../../../src/components/settings/TransparencyPreference';
import { renderWithProviders } from '../../test-utils';
import { settings } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, IOS_CAPABILITIES } from '../state';

const trackerMock = vi.hoisted(() => ({ setPreferences: vi.fn() }));
const platform = vi.hoisted(() => ({
  capabilities: {
    screenshots: true,
    foregroundApp: true,
    inputCounts: false,
    webcam: true,
    background: true,
  },
}));

vi.mock('../../../../src/tracker/instance', () => ({ tracker: trackerMock }));
vi.mock('../../../../src/tracker/platform', () => platform);

beforeEach(() => {
  Object.assign(platform.capabilities, ANDROID_CAPABILITIES);
});

describe('CaptureSoundPreference', () => {
  it('plays the shutter until the employee mutes it on this phone', async () => {
    renderWithProviders(<CaptureSoundPreference muted={false} settings={settings()} />);

    expect(screen.getByText('Mute the screenshot sound')).toBeInTheDocument();
    expect(screen.getByText(/^A camera shutter plays/)).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    await waitFor(() =>
      expect(trackerMock.setPreferences).toHaveBeenCalledWith({ muteCaptureSound: true }),
    );
  });

  it('says captures are silent once muted, and unmutes', async () => {
    renderWithProviders(<CaptureSoundPreference muted settings={null} />);

    expect(screen.getByText(/^Screenshots are taken silently on this phone/)).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(toggle);
    await waitFor(() =>
      expect(trackerMock.setPreferences).toHaveBeenCalledWith({ muteCaptureSound: false }),
    );
  });

  it('locks the switch when the workspace has already silenced every capture', () => {
    renderWithProviders(
      <CaptureSoundPreference muted={false} settings={settings({ captureSoundEnabled: false })} />,
    );

    expect(
      screen.getByText(/^Your workspace has already turned the capture sound off/),
    ).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(toggle);
    expect(trackerMock.setPreferences).not.toHaveBeenCalled();
  });

  it('locks the switch on a phone that takes no screenshots, and says why', () => {
    Object.assign(platform.capabilities, IOS_CAPABILITIES);
    renderWithProviders(<CaptureSoundPreference muted={false} settings={settings()} />);

    expect(screen.getByText(/^iPhone does not let apps capture the screen/)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('TransparencyPreference', () => {
  it('paints the background solid until it is switched on', async () => {
    renderWithProviders(<TransparencyPreference transparent={false} opacity={0.75} />);

    expect(screen.getByText('The background is painted solid.')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(trackerMock.setPreferences).toHaveBeenCalledWith({ transparentBackground: true }),
    );
  });

  it('lets the brand show through, with how much of the ground is left', () => {
    renderWithProviders(<TransparencyPreference transparent opacity={0.75} />);

    expect(
      screen.getByText('Your workspace’s colours show through behind the cards.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: '75%' })).toHaveAttribute('aria-checked', 'true');
  });

  it('saves a new opacity as a number', () => {
    renderWithProviders(<TransparencyPreference transparent opacity={0.75} />);

    fireEvent.click(screen.getByRole('radio', { name: '90%' }));

    expect(trackerMock.setPreferences).toHaveBeenCalledWith({ backgroundOpacity: 0.9 });
  });

  it('turns the gradient off again', async () => {
    renderWithProviders(<TransparencyPreference transparent opacity={0.5} />);

    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(trackerMock.setPreferences).toHaveBeenCalledWith({ transparentBackground: false }),
    );
  });
});
