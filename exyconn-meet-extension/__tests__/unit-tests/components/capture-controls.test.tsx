import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Logger } from '@exyconn/logger';
import { CaptureControls } from '../../../src/components/CaptureControls';
import type { TabSnapshot } from '../../../src/types/messages';
import { installChrome } from '../chrome-mock';

const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn() } as unknown as Logger;
const tab: TabSnapshot = {
  tabId: 7,
  meetingCode: 'abc-defg-hij',
  meetingId: 'm1',
  meetingState: 'IN_MEETING',
  transcriptionState: 'OFF',
  captureState: 'IDLE',
  captureError: null,
  consentRecorded: false,
  micEnabled: false,
  pendingUploads: 0,
  participantCount: 2,
  captureElsewhere: false,
  reminderBanner: false,
  iconStatus: 'ATTENTION',
};

const POPUP_HINT = 'Start transcription from the assistant panel in your Google Meet tab';

afterEach(() => vi.unstubAllGlobals());

describe('CaptureControls', () => {
  it('in the popup, points to the Meet panel instead of offering Start', () => {
    installChrome();
    render(<CaptureControls tab={tab} tabId={7} logger={logger} />);
    expect(screen.getByText(POPUP_HINT)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start transcription' })).toBeNull();
  });

  it('never starts before consent: the dialog comes first, then onStart(true)', async () => {
    const chrome = installChrome();
    const onStart = vi.fn(() => Promise.resolve());
    render(<CaptureControls tab={tab} logger={logger} onStart={onStart} />);
    expect(screen.queryByText(POPUP_HINT)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    expect(onStart).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('save the recording');
    fireEvent.click(screen.getByRole('button', { name: /Everyone has been told/ }));
    await waitFor(() => expect(onStart).toHaveBeenCalledWith(true));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('starts straight away when consent is already on record, and shows a failure', async () => {
    installChrome();
    const onStart = vi.fn(() =>
      Promise.reject(new Error('Sharing this tab was cancelled, so transcription did not start')),
    );
    render(
      <CaptureControls tab={{ ...tab, consentRecorded: true }} logger={logger} onStart={onStart} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    expect(
      await screen.findByText('Sharing this tab was cancelled, so transcription did not start'),
    ).toBeInTheDocument();
    expect(onStart).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the consent dialog open when the start fails, so it can be tried again', async () => {
    installChrome();
    const onStart = vi.fn(() => Promise.reject(new Error('Sharing this tab was cancelled')));
    render(<CaptureControls tab={tab} logger={logger} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    fireEvent.click(await screen.findByRole('button', { name: /Everyone has been told/ }));
    await waitFor(() => expect(onStart).toHaveBeenCalledWith(true));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('offers pause and stop while recording, and resume while paused', () => {
    installChrome();
    const { rerender } = render(
      <CaptureControls tab={{ ...tab, captureState: 'RECORDING' }} logger={logger} />,
    );
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Start transcription' })).toBeNull();
    expect(screen.queryByText(POPUP_HINT)).toBeNull();
    rerender(
      <CaptureControls
        tab={{ ...tab, captureState: 'PAUSED', captureError: 'Uploads are falling behind' }}
        logger={logger}
      />,
    );
    expect(screen.getByRole('button', { name: 'Resume' })).toBeEnabled();
    expect(screen.getByText('Uploads are falling behind')).toBeInTheDocument();
  });

  it('blocks starting in a second tab of the same call', () => {
    installChrome();
    render(
      <CaptureControls
        tab={{ ...tab, captureElsewhere: true }}
        logger={logger}
        onStart={vi.fn(() => Promise.resolve())}
      />,
    );
    expect(screen.getByRole('button', { name: 'Start transcription' })).toBeDisabled();
    expect(
      screen.getByText('This call is already being transcribed in another tab'),
    ).toBeInTheDocument();
  });

  it('does nothing on confirm once the start action has gone away', async () => {
    const chrome = installChrome();
    const onStart = vi.fn(() => Promise.resolve());
    const { rerender } = render(<CaptureControls tab={tab} logger={logger} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    await screen.findByRole('dialog');
    rerender(<CaptureControls tab={tab} logger={logger} />);
    fireEvent.click(screen.getByRole('button', { name: /Everyone has been told/ }));
    expect(onStart).not.toHaveBeenCalled();
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('blocks starting before the call is joined', () => {
    installChrome();
    render(
      <CaptureControls
        tab={{ ...tab, meetingId: null, meetingState: 'WAITING' }}
        logger={logger}
        onStart={vi.fn(() => Promise.resolve())}
      />,
    );
    expect(screen.getByRole('button', { name: 'Start transcription' })).toBeDisabled();
  });
});
