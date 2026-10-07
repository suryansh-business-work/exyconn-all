import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useVoiceRecorder,
  voiceNotesSupported,
} from '../../../../../../src/pages/chat/forms/chat-reply/useVoiceRecorder';
import { renderHookWithProviders } from '../../../../test-utils';
import { FakeMediaRecorder, fakeStream, installMicrophone } from './voice-recorder-fakes';

vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  fileToDataUrl: vi.fn(),
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));

const mic = vi.hoisted(() => ({ getUserMedia: vi.fn() }));
const onRecorded = vi.fn();

function renderRecorder(maxUploadMb = 5) {
  return renderHookWithProviders(() => useVoiceRecorder(maxUploadMb, onRecorded));
}

async function startRecording(maxUploadMb = 5) {
  const hook = renderRecorder(maxUploadMb);
  act(() => hook.result.current.start());
  await waitFor(() => expect(hook.result.current.recording).toBe(true));
  return { ...hook, recorder: FakeMediaRecorder.instances[0] };
}

describe('voiceNotesSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    installMicrophone(undefined);
  });

  it('needs both MediaRecorder and microphone access', () => {
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    installMicrophone(undefined);
    expect(voiceNotesSupported()).toBe(false);

    installMicrophone(mic.getUserMedia);
    expect(voiceNotesSupported()).toBe(true);

    vi.unstubAllGlobals();
    Reflect.deleteProperty(globalThis, 'MediaRecorder');
    expect(voiceNotesSupported()).toBe(false);
  });
});

describe('useVoiceRecorder', () => {
  let stream: ReturnType<typeof fakeStream>;

  beforeEach(() => {
    FakeMediaRecorder.instances = [];
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    stream = fakeStream();
    mic.getUserMedia.mockReset().mockResolvedValue(stream.stream);
    installMicrophone(mic.getUserMedia);
    onRecorded.mockReset();
    vi.mocked(portalLogger.warn).mockClear();
    vi.mocked(fileToDataUrl)
      .mockReset()
      .mockImplementation((file: File) => Promise.resolve(`data:${file.type};base64,AAAA`));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    installMicrophone(undefined);
  });

  it('records from the microphone until stopped', async () => {
    const { result, recorder } = await startRecording();

    expect(mic.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(recorder.state).toBe('recording');
    expect(result.current.seconds).toBe(0);
  });

  it('attaches the note on stop, without codec parameters in its type', async () => {
    const { result, recorder } = await startRecording();
    recorder.record(new Blob(['abc'], { type: 'audio/webm;codecs=opus' }), new Blob(['de']));
    act(() => result.current.stop());

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(onRecorded.mock.calls[0][0]).toMatchObject({
      name: 'voice-note.webm',
      data: 'data:audio/webm;base64,AAAA',
      size: 5,
    });
    const file = vi.mocked(fileToDataUrl).mock.calls[0][0];
    expect(file.type).toBe('audio/webm');
    expect(result.current.recording).toBe(false);
    expect(stream.track.stop).toHaveBeenCalled();
  });

  it('names the note after the format the browser recorded', async () => {
    const { result, recorder } = await startRecording();
    recorder.record(new Blob(['abc'], { type: 'audio/mp4' }));
    act(() => result.current.stop());

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(onRecorded.mock.calls[0][0].name).toBe('voice-note.m4a');
  });

  it('falls back to .webm for a format it does not know', async () => {
    const { result, recorder } = await startRecording();
    recorder.record(new Blob(['abc'], { type: 'audio/x-unknown' }));
    act(() => result.current.stop());

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(onRecorded.mock.calls[0][0].name).toBe('voice-note.webm');
  });

  it('throws the note away on cancel and releases the microphone', async () => {
    const { result, recorder } = await startRecording();
    recorder.record(new Blob(['abc'], { type: 'audio/webm' }));
    act(() => result.current.cancel());

    await waitFor(() => expect(result.current.recording).toBe(false));
    expect(stream.track.stop).toHaveBeenCalled();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('attaches nothing when nothing was recorded', async () => {
    const { result } = await startRecording();
    act(() => result.current.stop());

    await waitFor(() => expect(result.current.recording).toBe(false));
    expect(fileToDataUrl).not.toHaveBeenCalled();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('refuses a note larger than the upload limit', async () => {
    const { result, recorder } = await startRecording(0);
    recorder.record(new Blob(['abc'], { type: 'audio/webm' }));
    act(() => result.current.stop());

    expect(
      await screen.findByText('The voice note is longer than the 0 MB limit allows'),
    ).toBeInTheDocument();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('logs and says so when the note cannot be prepared', async () => {
    const failure = new Error('read failed');
    vi.mocked(fileToDataUrl).mockRejectedValue(failure);
    const { result, recorder } = await startRecording();
    recorder.record(new Blob(['abc'], { type: 'audio/webm' }));
    act(() => result.current.stop());

    expect(await screen.findByText('The voice note could not be attached')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith('Could not prepare the voice note', failure);
  });

  it('drops the recording when the page closes mid-note', async () => {
    const { recorder, unmount } = await startRecording();
    recorder.record(new Blob(['abc'], { type: 'audio/webm' }));
    unmount();

    expect(recorder.stop).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('does nothing on stop, cancel or close when nothing is recording', () => {
    const { result, unmount } = renderRecorder();
    act(() => result.current.stop());
    act(() => result.current.cancel());
    unmount();

    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });
});
