import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtensionSettingsForm } from '../../../src/options/forms/extension-settings';
import { OptionsApp } from '../../../src/options/OptionsApp';
import { OptionsRoot } from '../../../src/options/OptionsRoot';
import { requestMicrophone } from '../../../src/options/microphone';
import { intervalOptions } from '../../../src/options/settings-options';
import { PopupApp } from '../../../src/popup/PopupApp';
import { PopupRoot } from '../../../src/popup/PopupRoot';
import { DEFAULT_PREFS } from '../../../src/storage/prefs';
import { ORG } from '../fake-portal';
import {
  SIGNED_IN,
  SIGNED_OUT,
  installBrowserGaps,
  testLogger,
  workerAnswering,
} from '../ui-helpers';

beforeEach(() => {
  installBrowserGaps();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const ORG_SWITCHES = {
  participantTracking: true,
  liveTranscript: true,
  remindersEnabled: true,
  reminderIntervalMinutes: 2,
};

function renderForm(overrides: Partial<Parameters<typeof ExtensionSettingsForm>[0]> = {}) {
  const props = {
    initial: DEFAULT_PREFS,
    org: ORG_SWITCHES,
    onSave: vi.fn(() => Promise.resolve()),
    requestMicrophone: vi.fn(() => Promise.resolve(true)),
    ...overrides,
  };
  render(<ExtensionSettingsForm {...props} />);
  return props;
}

describe('ExtensionSettingsForm', () => {
  it('saves the values and confirms', async () => {
    const props = renderForm();
    await userEvent.click(screen.getByRole('switch', { name: 'Track participants' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Settings saved')).toBeInTheDocument();
    expect(props.onSave).toHaveBeenCalledWith({ ...DEFAULT_PREFS, participantTracking: false });
  });

  it('validates the snooze length, including an empty box', async () => {
    const props = renderForm();
    const snooze = screen.getByRole('spinbutton', { name: 'Snooze length (minutes)' });
    await userEvent.clear(snooze);
    await userEvent.type(snooze, '2');
    await userEvent.tab();
    expect(await screen.findByText('Snooze for at least 5 minutes')).toBeInTheDocument();
    await userEvent.clear(snooze);
    await userEvent.tab();
    expect(await screen.findByText('Enter a number of minutes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it('picks from the selects', async () => {
    const props = renderForm({ org: null });
    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Dark' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' })),
    );
    expect(screen.getByRole('combobox', { name: 'Remind me' })).toHaveTextContent(
      'Company default',
    );
  });

  it('asks for the microphone before turning it on, and explains a refusal', async () => {
    const granted = renderForm();
    await userEvent.click(screen.getByRole('switch', { name: 'Also record my microphone' }));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Also record my microphone' })).toBeChecked(),
    );
    expect(granted.requestMicrophone).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('switch', { name: 'Also record my microphone' }));
    expect(screen.getByRole('switch', { name: 'Also record my microphone' })).not.toBeChecked();
  });

  it('keeps the microphone off when permission is refused or the prompt fails', async () => {
    renderForm({ requestMicrophone: vi.fn(() => Promise.resolve(false)) });
    await userEvent.click(screen.getByRole('switch', { name: 'Also record my microphone' }));
    expect(await screen.findByText(/Microphone permission was denied/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Also record my microphone' })).not.toBeChecked();
  });

  it('turns the switch back off when the permission prompt itself fails', async () => {
    renderForm({ requestMicrophone: vi.fn(() => Promise.reject(new Error('blocked'))) });
    await userEvent.click(screen.getByRole('switch', { name: 'Also record my microphone' }));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Also record my microphone' })).not.toBeChecked(),
    );
  });

  it('locks what the company turned off and shows save failures', async () => {
    renderForm({
      org: {
        ...ORG_SWITCHES,
        participantTracking: false,
        liveTranscript: false,
        remindersEnabled: false,
      },
      onSave: vi.fn(() => Promise.reject(new Error('Quota exceeded'))),
    });
    expect(screen.getByRole('switch', { name: 'Track participants' })).toBeDisabled();
    expect(screen.getAllByText('Turned off by your company')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Quota exceeded')).toBeInTheDocument();
  });

  it('resets to the defaults', async () => {
    const props = renderForm({ initial: { ...DEFAULT_PREFS, theme: 'dark' } });
    await userEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalledWith(DEFAULT_PREFS));
  });
});

describe('settings options and microphone', () => {
  it('labels the company default with its minutes when known', () => {
    expect(intervalOptions(5)[0]).toEqual({
      value: 'org',
      label: 'Company default ({minutes} min)',
      values: { minutes: 5 },
    });
    expect(intervalOptions(null)[0]).toEqual({ value: 'org', label: 'Company default' });
    expect(intervalOptions(null).map((option) => option.value)).toEqual([
      'org',
      '1',
      '2',
      '5',
      '10',
    ]);
  });

  it('asks Chrome for the microphone and releases it at once', async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn(() => Promise.resolve({ getTracks: () => [{ stop }] }));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    await expect(requestMicrophone()).resolves.toBe(true);
    expect(stop).toHaveBeenCalledTimes(1);
    getUserMedia.mockRejectedValueOnce(new Error('denied'));
    await expect(requestMicrophone()).resolves.toBe(false);
  });
});

describe('options page', () => {
  it('shows the account and the form, and saves to sync storage', async () => {
    const chrome = workerAnswering({ 'state/get': SIGNED_IN, 'i18n/messages': {} });
    render(<OptionsRoot logger={testLogger()} />);
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(chrome.storage.sync.data.get('prefs')).toEqual(DEFAULT_PREFS));
  });

  it('shows loading and read errors', () => {
    workerAnswering({ 'state/get': SIGNED_OUT });
    const { rerender } = render(
      <OptionsApp prefs={null} prefsError={null} logger={testLogger()} />,
    );
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    rerender(<OptionsApp prefs={null} prefsError={new Error('x')} logger={testLogger()} />);
    expect(screen.getByText('Could not read your settings')).toBeInTheDocument();
  });
});

describe('popup', () => {
  it('shows the call on the active tab with its controls', async () => {
    const chrome = workerAnswering({ 'state/get': SIGNED_IN, 'i18n/messages': {} });
    render(<PopupRoot logger={testLogger()} />);
    expect(await screen.findByRole('button', { name: 'Start transcription' })).toBeInTheDocument();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'state/get', tabId: 7 });
    expect(screen.getByRole('link', { name: /Open portal/ })).toHaveAttribute(
      'href',
      'https://employee.test/me/meetings',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('asks to sign in when signed out', async () => {
    workerAnswering({ 'state/get': SIGNED_OUT });
    render(<PopupApp tabId={null} logger={testLogger()} />);
    expect(await screen.findByRole('button', { name: 'Sign in with Exyconn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open portal/ })).toHaveAttribute(
      'href',
      'http://localhost:4021/me/meetings',
    );
  });

  it('suggests opening a call on another page, and logs a settings failure', async () => {
    const chrome = workerAnswering({ 'state/get': { auth: SIGNED_IN.auth, tab: null } });
    chrome.runtime.openOptionsPage.mockRejectedValueOnce(new Error('x'));
    const logger = testLogger();
    render(<PopupApp tabId={3} logger={logger} />);
    expect(
      await screen.findByText('Open a Google Meet call to use the assistant'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not open settings', expect.any(Error)),
    );
  });

  it('works without a readable active tab', async () => {
    const chrome = workerAnswering({ 'state/get': SIGNED_OUT });
    chrome.tabs.query.mockRejectedValueOnce(new Error('no tabs'));
    const logger = testLogger();
    render(<PopupRoot logger={logger} />);
    expect(await screen.findByRole('button', { name: 'Sign in with Exyconn' })).toBeInTheDocument();
    expect(logger.warn).toHaveBeenCalledWith('Could not read the active tab', expect.any(Error));
  });

  it('treats a tab without an id as no tab', async () => {
    const chrome = workerAnswering({ 'state/get': SIGNED_OUT });
    chrome.tabs.query.mockResolvedValueOnce([{} as chrome.tabs.Tab]);
    render(<PopupRoot logger={testLogger()} />);
    expect(await screen.findByRole('button', { name: 'Sign in with Exyconn' })).toBeInTheDocument();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'state/get' });
  });

  it('keeps showing the loader until the worker answers, and logs when it cannot', async () => {
    workerAnswering({ 'state/get': new Error('worker asleep') });
    const logger = testLogger();
    render(<PopupApp tabId={1} logger={logger} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith(
        'Could not read the assistant state',
        expect.any(Error),
      ),
    );
    expect(ORG.portalUrl).toBe('https://employee.test');
  });
});
