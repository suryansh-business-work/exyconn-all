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

afterEach(() => vi.unstubAllGlobals());

describe('CaptureControls', () => {
  it('never starts before consent: the dialog comes first, then consent, then start', async () => {
    const chrome = installChrome();
    chrome.runtime.sendMessage.mockResolvedValue({ ok: true, data: null });
    render(<CaptureControls tab={tab} tabId={7} logger={logger} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('save the recording');
    fireEvent.click(screen.getByRole('button', { name: /Everyone has been told/ }));
    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2));
    expect(chrome.runtime.sendMessage.mock.calls.map(([message]) => message)).toEqual([
      { type: 'capture/consent', tabId: 7 },
      { type: 'capture/start', tabId: 7 },
    ]);
  });

  it('starts straight away when consent is already on record, and shows a failure', async () => {
    const chrome = installChrome();
    chrome.runtime.sendMessage.mockResolvedValue({
      ok: false,
      error: 'Join the call before starting transcription',
    });
    render(<CaptureControls tab={{ ...tab, consentRecorded: true }} tabId={7} logger={logger} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start transcription' }));
    expect(
      await screen.findByText('Join the call before starting transcription'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('offers pause and stop while recording, and resume while paused', () => {
    installChrome();
    const { rerender } = render(
      <CaptureControls tab={{ ...tab, captureState: 'RECORDING' }} logger={logger} />,
    );
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Start transcription' })).toBeNull();
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
    render(<CaptureControls tab={{ ...tab, captureElsewhere: true }} logger={logger} />);
    expect(screen.getByRole('button', { name: 'Start transcription' })).toBeDisabled();
    expect(
      screen.getByText('This call is already being transcribed in another tab'),
    ).toBeInTheDocument();
  });
});
