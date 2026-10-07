import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';
import { IPC, type CaptureRequest, type CaptureResult } from '@shared/types';
import type { ComposeInput } from '@exyconn/tracker-core';

type Listener = (event: unknown, result: CaptureResult) => void;

const { listeners } = vi.hoisted(() => ({ listeners: new Map<string, Listener>() }));

vi.mock('../../../src/main/web-security', () => ({
  onTrusted: (channel: string, fn: Listener) => listeners.set(channel, fn),
}));

import { composeWithWebcam, registerCaptureBridge } from '../../../src/main/capture-bridge';

const INPUT: ComposeInput = {
  screen: 'c2NyZWVu',
  mimeType: 'image/png',
  corner: 'bottom-right',
  quality: 80,
};

/** A window whose renderer records the capture requests it was sent. */
function rendererWindow(destroyed = false) {
  const send = vi.fn();
  const win = { isDestroyed: () => destroyed, webContents: { send } };
  return { win: win as unknown as BrowserWindow, send };
}

function answer(result: CaptureResult): void {
  listeners.get(IPC.captureResult)?.({}, result);
}

function requestOf(send: ReturnType<typeof vi.fn>): CaptureRequest {
  return send.mock.calls[0][1] as CaptureRequest;
}

beforeEach(() => {
  vi.useFakeTimers();
  registerCaptureBridge();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('composeWithWebcam', () => {
  it('answers null at once when there is no live window to take the photo', async () => {
    await expect(composeWithWebcam(null, INPUT)).resolves.toBeNull();
    const { win, send } = rendererWindow(true);
    await expect(composeWithWebcam(win, INPUT)).resolves.toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it('asks the renderer with a fresh id and resolves with the composited image', async () => {
    const { win, send } = rendererWindow();

    const result = composeWithWebcam(win, INPUT);
    const request = requestOf(send);
    expect(send).toHaveBeenCalledWith(IPC.captureRequested, expect.objectContaining(INPUT));
    expect(request.id).toMatch(/^[\da-f-]{36}$/);

    answer({ id: request.id, image: 'Y29tcG9zaXRl', error: null });

    await expect(result).resolves.toBe('Y29tcG9zaXRl');
  });

  it('logs a failed photo and resolves with whatever the renderer sent back', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { win, send } = rendererWindow();

    const result = composeWithWebcam(win, INPUT);
    answer({ id: requestOf(send).id, image: null, error: 'Permission denied' });

    await expect(result).resolves.toBeNull();
    expect(error).toHaveBeenCalledWith(
      'Webcam capture failed; uploading the screenshot without a photo',
      'Permission denied',
    );
  });

  it('gives up after eight seconds, and ignores an answer that comes too late', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { win, send } = rendererWindow();

    const result = composeWithWebcam(win, INPUT);
    vi.advanceTimersByTime(8_000);

    await expect(result).resolves.toBeNull();
    expect(error).toHaveBeenCalledWith(
      'Webcam capture timed out; uploading the screenshot without a photo',
    );
    expect(() => answer({ id: requestOf(send).id, image: 'bGF0ZQ==', error: null })).not.toThrow();
  });

  it('keeps concurrent requests apart by id and ignores unknown ids', async () => {
    const first = rendererWindow();
    const second = rendererWindow();

    const a = composeWithWebcam(first.win, INPUT);
    const b = composeWithWebcam(second.win, INPUT);
    answer({ id: 'not-a-request', image: 'eA==', error: null });
    answer({ id: requestOf(second.send).id, image: 'Yg==', error: null });
    answer({ id: requestOf(first.send).id, image: 'YQ==', error: null });

    await expect(Promise.all([a, b])).resolves.toEqual(['YQ==', 'Yg==']);
  });
});
