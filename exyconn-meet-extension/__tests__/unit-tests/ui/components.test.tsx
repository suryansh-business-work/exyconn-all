import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountCard } from '../../../src/components/AccountCard';
import { AppProviders } from '../../../src/components/AppProviders';
import { CaptureControls } from '../../../src/components/CaptureControls';
import { ConsentDialog } from '../../../src/components/ConsentDialog';
import { MeetingStatus } from '../../../src/components/MeetingStatus';
import { useColorScheme } from '../../../src/hooks/useColorScheme';
import { extensionTheme } from '../../../src/theme/theme';
import { STATUS_COLORS } from '../../../src/theme/status-colors';
import { ORG } from '../fake-portal';
import {
  SIGNED_OUT,
  TAB_SNAPSHOT,
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

function Boom(): never {
  throw new Error('render failed');
}

describe('AccountCard', () => {
  it('signs in through the worker and reports when it fails', async () => {
    const chrome = workerAnswering({ 'auth/sign-in': new Error('Sign-in was cancelled') });
    const onChanged = vi.fn();
    render(<AccountCard auth={SIGNED_OUT.auth} logger={testLogger()} onChanged={onChanged} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Exyconn' }));
    expect(await screen.findByText('Sign-in was cancelled')).toBeInTheDocument();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'auth/sign-in' });
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('shows the account, warns when the company turned it off, and signs out', async () => {
    workerAnswering({});
    const onChanged = vi.fn();
    render(
      <AccountCard
        auth={{ signedIn: true, org: { ...ORG, enabled: false } }}
        logger={testLogger()}
        onChanged={onChanged}
      />,
    );
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@acme.test · Acme')).toBeInTheDocument();
    expect(
      screen.getByText('Meeting transcription is turned off for your company'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  });
});

describe('MeetingStatus', () => {
  it('shows a recording indicator and the audio still processing', () => {
    render(
      <MeetingStatus tab={{ ...TAB_SNAPSHOT, captureState: 'RECORDING', pendingUploads: 2 }} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('In the meeting');
    expect(screen.getByText('Recording')).toBeInTheDocument();
    expect(screen.getByText('Processing 2 audio chunks')).toBeInTheDocument();
  });

  it('names the capture state when not recording', () => {
    render(
      <MeetingStatus
        tab={{ ...TAB_SNAPSHOT, captureState: 'PAUSED', transcriptionState: 'OFF' }}
      />,
    );
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Meet transcription is off')).toBeInTheDocument();
    expect(screen.queryByText(/Processing/)).toBeNull();
  });
});

describe('ConsentDialog', () => {
  it('says the audio is recorded, saved and transcribed, and can be cancelled', async () => {
    const onCancel = vi.fn();
    render(<ConsentDialog open busy={false} onConfirm={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByRole('dialog')).toHaveTextContent(
      /record the meeting audio .* save the recording .* transcribe it/,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('CaptureControls actions', () => {
  it('sends pause, resume and stop for the tab', async () => {
    const chrome = workerAnswering({});
    const { rerender } = render(
      <CaptureControls
        tab={{ ...TAB_SNAPSHOT, captureState: 'RECORDING' }}
        tabId={7}
        logger={testLogger()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    rerender(
      <CaptureControls
        tab={{ ...TAB_SNAPSHOT, captureState: 'PAUSED' }}
        tabId={7}
        logger={testLogger()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(chrome.runtime.sendMessage.mock.calls.map(([message]) => message)).toEqual([
      { type: 'capture/pause', tabId: 7 },
      { type: 'capture/stop', tabId: 7 },
      { type: 'capture/resume', tabId: 7 },
    ]);
  });

  it('shows an error state and keeps the consent dialog open when consent fails', async () => {
    workerAnswering({
      'capture/consent': new Error('Join the call before starting transcription'),
    });
    render(
      <CaptureControls
        tab={{
          ...TAB_SNAPSHOT,
          consentRecorded: false,
          captureState: 'ERROR',
          captureError: 'Audio could not be uploaded',
        }}
        logger={testLogger()}
      />,
    );
    expect(screen.getByText('Audio could not be uploaded')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    await userEvent.click(screen.getByRole('button', { name: /Everyone has been told/ }));
    expect(
      await screen.findByText('Join the call before starting transcription'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('CaptureControls consent', () => {
  it('closes the consent dialog without recording when cancelled', async () => {
    const chrome = workerAnswering({});
    render(
      <CaptureControls tab={{ ...TAB_SNAPSHOT, consentRecorded: false }} logger={testLogger()} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'capture/consent' }),
    );
  });
});

describe('CrashFallback and AppProviders', () => {
  it('offers Retry and Report an issue after a crash, and reports the crash', async () => {
    workerAnswering({ 'i18n/messages': {} });
    const logger = testLogger();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AppProviders logger={logger} theme="light">
        <Boom />
      </AppProviders>,
    );
    expect(screen.getByText('The meeting assistant hit a problem')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report an issue' })).toHaveAttribute(
      'href',
      'http://localhost:4021/me/support',
    );
    expect(logger.capture).toHaveBeenCalledWith(expect.any(Error), expect.anything());
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(logger.capture).toHaveBeenCalledTimes(2);
  });

  it('renders in the browser language with the portal translations', async () => {
    workerAnswering({ 'i18n/messages': { Recording: 'Aufnahme' } });
    render(
      <AppProviders logger={testLogger()} theme="dark">
        <MeetingStatus tab={{ ...TAB_SNAPSHOT, captureState: 'RECORDING' }} />
      </AppProviders>,
    );
    expect(await screen.findByText('Aufnahme')).toBeInTheDocument();
    expect(document.querySelector('[lang="en-US"]')).not.toBeNull();
  });

  it('keeps English when translations fail, and styles inside a shadow root', async () => {
    workerAnswering({ 'i18n/messages': new Error('down') });
    const logger = testLogger();
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const portal = document.createElement('div');
    root.append(portal);
    render(
      <AppProviders logger={logger} theme="system" shadow={{ root, portal }}>
        <MeetingStatus tab={TAB_SNAPSHOT} />
      </AppProviders>,
      { container: root.appendChild(document.createElement('div')) },
    );
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not load translations', expect.any(Error)),
    );
    expect(root.querySelector('style')).not.toBeNull();
  });
});

describe('theme', () => {
  it('builds both schemes and points portals into the shadow root', () => {
    const portal = document.createElement('div');
    expect(extensionTheme('dark').palette.mode).toBe('dark');
    const scoped = extensionTheme('light', portal);
    expect(scoped.components?.MuiDialog?.defaultProps).toEqual({ container: portal });
    expect(STATUS_COLORS.ACTIVE.ink).toBe('#ffffff');
  });

  it('follows the system scheme only when the user chose "system"', () => {
    const { setDark } = installBrowserGaps(false);
    const { result, rerender } = renderHook(({ choice }) => useColorScheme(choice), {
      initialProps: { choice: 'system' as const },
    });
    expect(result.current).toBe('light');
    act(() => setDark(true));
    expect(result.current).toBe('dark');
    rerender({ choice: 'light' as never });
    expect(result.current).toBe('light');
  });
});
