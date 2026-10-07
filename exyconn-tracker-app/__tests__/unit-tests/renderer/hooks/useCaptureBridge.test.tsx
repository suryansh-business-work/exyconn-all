// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CaptureRequest, CaptureResult } from '@shared/types';
import useCaptureBridge from '../../../../src/renderer/hooks/useCaptureBridge';
import { composeCapture } from '../../../../src/renderer/capture/compose';
import { flush, render, stubTracker, unmountAll } from '../../test-utils';

vi.mock('../../../../src/renderer/capture/compose', () => ({ composeCapture: vi.fn() }));

function Probe(): ReactElement {
  useCaptureBridge();
  return <span />;
}

type Listener = (request: CaptureRequest) => void;

const REQUEST: CaptureRequest = {
  id: 'req-1',
  screen: 'c2NyZWVu',
  mimeType: 'image/jpeg',
  corner: 'bottom-right',
  quality: 80,
};

let listener: Listener = () => undefined;
const unsubscribe = vi.fn();
const sendCaptureResult = vi.fn<(result: CaptureResult) => void>();

function install(): void {
  stubTracker({
    onCaptureRequested: (next: Listener) => {
      listener = next;
      return unsubscribe;
    },
    sendCaptureResult,
  });
}

async function request(): Promise<void> {
  act(() => listener(REQUEST));
  await flush();
}

afterEach(() => {
  unmountAll();
  vi.mocked(composeCapture).mockReset();
  sendCaptureResult.mockClear();
  unsubscribe.mockClear();
});

describe('useCaptureBridge', () => {
  it('composites the webcam photo into the screenshot and answers with it', async () => {
    vi.mocked(composeCapture).mockResolvedValue('Y29tcG9zZWQ=');
    install();
    await render(<Probe />);
    await request();
    expect(composeCapture).toHaveBeenCalledWith(REQUEST);
    expect(sendCaptureResult).toHaveBeenCalledWith({
      id: 'req-1',
      image: 'Y29tcG9zZWQ=',
      error: null,
    });
  });

  it('reports the camera’s own reason when the photo fails, so main uploads the plain shot', async () => {
    vi.mocked(composeCapture).mockRejectedValue(new Error('Camera busy'));
    install();
    await render(<Probe />);
    await request();
    expect(sendCaptureResult).toHaveBeenCalledWith({
      id: 'req-1',
      image: null,
      error: 'Camera busy',
    });
  });

  it('falls back to a plain reason when the failure is not an Error', async () => {
    vi.mocked(composeCapture).mockRejectedValue('denied');
    install();
    await render(<Probe />);
    await request();
    expect(sendCaptureResult).toHaveBeenCalledWith({
      id: 'req-1',
      image: null,
      error: 'The webcam photo failed.',
    });
  });

  it('stops answering once unmounted', async () => {
    install();
    await render(<Probe />);
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
