import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ChatAlertSettings } from '../../../../../src/pages/chat/alerts/ChatAlertSettings';
import {
  desktopNotificationsSupported,
  requestDesktopPermission,
} from '../../../../../src/pages/chat/alerts/desktopNotification';
import type { ChatAlertPrefs } from '../../../../../src/pages/chat/alerts/chatAlertPrefs';
import { fakeConsole, renderWithConsole, type FakeConsole } from '../chat-console';

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));
vi.mock('../../../../../src/pages/chat/alerts/desktopNotification', () => ({
  desktopNotificationsSupported: vi.fn(),
  requestDesktopPermission: vi.fn(),
}));

const SOUND = 'Play a sound for new messages';
const DESKTOP = 'Desktop notification when this tab is in the background';
const ANIMATE = 'Animate new messages';
const PREFS: ChatAlertPrefs = { sound: true, desktop: false, animate: true };

async function openSettings(prefs: ChatAlertPrefs = PREFS): Promise<FakeConsole> {
  const chat = fakeConsole({ prefs });
  renderWithConsole(<ChatAlertSettings />, () => chat);
  await userEvent.click(screen.getByRole('button', { name: 'Notification settings' }));
  return chat;
}

describe('ChatAlertSettings', () => {
  beforeEach(() => {
    vi.mocked(desktopNotificationsSupported).mockReset().mockReturnValue(true);
    vi.mocked(requestDesktopPermission).mockReset().mockResolvedValue(true);
    vi.mocked(portalLogger.warn).mockClear();
  });

  it('opens the browser-only choices, each showing what is saved', async () => {
    await openSettings();

    expect(screen.getByText('Notify me about new chat messages')).toBeInTheDocument();
    expect(screen.getByText('Saved in this browser only.')).toBeInTheDocument();
    expect(screen.getByLabelText(SOUND)).toBeChecked();
    expect(screen.getByLabelText(DESKTOP)).not.toBeChecked();
    expect(screen.getByLabelText(ANIMATE)).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Notification settings', hidden: true }),
    ).toHaveAttribute('aria-controls');
  });

  it('switches the sound and the animation off', async () => {
    const chat = await openSettings();

    await userEvent.click(screen.getByLabelText(SOUND));
    expect(chat.setPrefs).toHaveBeenLastCalledWith({ ...PREFS, sound: false });

    await userEvent.click(screen.getByLabelText(ANIMATE));
    expect(chat.setPrefs).toHaveBeenLastCalledWith({ ...PREFS, animate: false });
  });

  it('turns desktop notifications on once the browser allows them', async () => {
    const chat = await openSettings();
    await userEvent.click(screen.getByLabelText(DESKTOP));

    await waitFor(() => expect(chat.setPrefs).toHaveBeenCalledWith({ ...PREFS, desktop: true }));
    expect(requestDesktopPermission).toHaveBeenCalledTimes(1);
  });

  it('explains how to allow notifications when the browser says no', async () => {
    vi.mocked(requestDesktopPermission).mockResolvedValue(false);
    const chat = await openSettings();
    await userEvent.click(screen.getByLabelText(DESKTOP));

    expect(
      await screen.findByText(
        'Allow notifications for this site in your browser to get desktop alerts',
      ),
    ).toBeInTheDocument();
    expect(chat.setPrefs).not.toHaveBeenCalled();
  });

  it('logs and says so when asking for permission fails', async () => {
    const failure = new Error('Permission prompt crashed');
    vi.mocked(requestDesktopPermission).mockRejectedValue(failure);
    const chat = await openSettings();
    await userEvent.click(screen.getByLabelText(DESKTOP));

    expect(
      await screen.findByText('Desktop notifications could not be switched on'),
    ).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'Asking for notification permission failed',
      failure,
    );
    expect(chat.setPrefs).not.toHaveBeenCalled();
  });

  it('turns desktop notifications off without asking', async () => {
    const on = { ...PREFS, desktop: true };
    const chat = await openSettings(on);
    await userEvent.click(screen.getByLabelText(DESKTOP));

    expect(chat.setPrefs).toHaveBeenCalledWith({ ...on, desktop: false });
    expect(requestDesktopPermission).not.toHaveBeenCalled();
  });

  it('cannot offer desktop notifications where the browser has none', async () => {
    vi.mocked(desktopNotificationsSupported).mockReturnValue(false);
    await openSettings();

    expect(screen.getByLabelText(DESKTOP)).toBeDisabled();
    expect(screen.getByLabelText(SOUND)).toBeEnabled();
  });

  it('closes again with Escape', async () => {
    await openSettings();
    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByText('Notify me about new chat messages')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Notification settings', hidden: true }),
    ).not.toHaveAttribute('aria-controls');
  });
});
