import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useVoiceRecorder } from '../../../../../../src/pages/chat/forms/chat-reply/useVoiceRecorder';
import { renderHookWithProviders } from '../../../../test-utils';
import { FakeMediaRecorder, fakeStream, installMicrophone } from './voice-recorder-fakes';

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));

const mic = vi.hoisted(() => ({ getUserMedia: vi.fn() }));

const BLOCKED =
  'Microphone access is blocked. Allow it for this site in your browser to record voice notes.';

function renderRecorder() {
  return renderHookWithProviders(() => useVoiceRecorder(5, vi.fn())).result;
}

describe('useVoiceRecorder when the microphone misbehaves', () => {
  beforeEach(() => {
    FakeMediaRecorder.instances.length = 0;
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    mic.getUserMedia.mockReset().mockResolvedValue(fakeStream().stream);
    installMicrophone(mic.getUserMedia);
    vi.mocked(portalLogger.warn).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    installMicrophone(undefined);
  });

  it('counts the seconds while recording', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const result = renderRecorder();
    act(() => result.current.start());
    await waitFor(() => expect(result.current.recording).toBe(true));

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.seconds).toBe(3);
  });

  it.each([
    ['NotAllowedError', BLOCKED],
    ['SecurityError', BLOCKED],
    ['NotFoundError', 'No microphone was found on this device.'],
    ['AbortError', 'The microphone could not be started.'],
  ])('explains a %s in words the person can act on', async (name, message) => {
    const refusal = new DOMException('Refused', name);
    mic.getUserMedia.mockRejectedValue(refusal);
    const result = renderRecorder();
    act(() => result.current.start());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(result.current.recording).toBe(false);
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'Could not start the microphone for a voice note',
      refusal,
    );
  });

  it('gives the general reason for a failure that is not a browser refusal', async () => {
    mic.getUserMedia.mockRejectedValue(new Error('driver crashed'));
    const result = renderRecorder();
    act(() => result.current.start());

    expect(await screen.findByText('The microphone could not be started.')).toBeInTheDocument();
  });

  it('never lets a failure while reporting escape as an unhandled rejection', async () => {
    const loggerDown = new Error('Log queue is full');
    vi.mocked(portalLogger.warn).mockImplementationOnce(() => {
      throw loggerDown;
    });
    mic.getUserMedia.mockRejectedValue(new DOMException('Refused', 'NotFoundError'));
    const result = renderRecorder();
    act(() => result.current.start());

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith('Voice note failed', loggerDown),
    );
    expect(result.current.recording).toBe(false);
  });
});
