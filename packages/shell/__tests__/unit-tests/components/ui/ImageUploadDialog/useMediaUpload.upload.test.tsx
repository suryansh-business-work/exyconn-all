import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import * as crop from '@/components/ui/ImageUploadDialog/crop-image';
import { useMediaUpload } from '@/components/ui/ImageUploadDialog/useMediaUpload';
import { dataUrlOf, fileEvent, importMock, mediaWrapper, uploadMock } from './mediaHarness';
import { pexelsItem } from './fixtures';

const RECT = { x: 0, y: 0, width: 10, height: 10 };
const PNG_URL = dataUrlOf('image/png', 'png-bytes');
const CDN = 'https://ik.imagekit.io/exyconn/branding/logo.png';

function setup(mocks: MockLink.MockedResponse[]) {
  const onUploaded = vi.fn();
  const hook = renderHook(() => useMediaUpload('branding', onUploaded), {
    wrapper: mediaWrapper(mocks),
  });
  return { onUploaded, ...hook };
}

async function pickPng(
  result: { current: ReturnType<typeof useMediaUpload> },
  type = 'image/png',
  name = 'logo.png',
) {
  await act(() => result.current.pickFile(fileEvent(new File(['png-bytes'], name, { type }))));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useMediaUpload uploading', () => {
  it('does nothing with nothing selected', async () => {
    const { result, onUploaded } = setup([]);

    await act(() => result.current.upload(null));

    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.uploading).toBe(false);
  });

  it('uploads the cropped region and hands back the hosted URL', async () => {
    const cropped = 'data:image/png;base64,Q1JPUA==';
    const cropSpy = vi.spyOn(crop, 'cropImageToDataUrl').mockResolvedValue(cropped);
    const { result, onUploaded } = setup([
      uploadMock({ file: cropped, fileName: 'logo.png', folder: 'branding' }, { url: CDN }),
    ]);
    await pickPng(result);

    await act(() => result.current.upload(RECT));

    expect(cropSpy).toHaveBeenCalledWith(PNG_URL, RECT, 'image/png');
    expect(onUploaded).toHaveBeenCalledWith(CDN);
    expect(result.current.selection).toBeNull();
    expect(result.current.uploading).toBe(false);
    expect(await screen.findByText('Upload complete')).toBeInTheDocument();
  });

  it('uploads the file itself when no crop was reported', async () => {
    const cropSpy = vi.spyOn(crop, 'cropImageToDataUrl');
    const { result, onUploaded } = setup([
      uploadMock({ file: PNG_URL, fileName: 'logo.png', folder: 'branding' }, { url: CDN }),
    ]);
    await pickPng(result);

    await act(() => result.current.upload(null));

    expect(cropSpy).not.toHaveBeenCalled();
    expect(onUploaded).toHaveBeenCalledWith(CDN);
  });

  it('never rasterises a vector, even with a crop', async () => {
    const cropSpy = vi.spyOn(crop, 'cropImageToDataUrl');
    const svgUrl = dataUrlOf('image/svg+xml', 'png-bytes');
    const { result, onUploaded } = setup([
      uploadMock({ file: svgUrl, fileName: 'mark.svg', folder: 'branding' }, { url: CDN }),
    ]);
    await pickPng(result, 'image/svg+xml', 'mark.svg');

    await act(() => result.current.upload(RECT));

    expect(cropSpy).not.toHaveBeenCalled();
    expect(onUploaded).toHaveBeenCalledWith(CDN);
  });

  it('imports a stock clip by its URL instead of uploading bytes', async () => {
    const clipUrl = 'https://videos.pexels.com/9.mp4';
    const { result, onUploaded } = setup([
      importMock(
        { url: clipUrl, fileName: 'pexels-9.mp4', folder: 'branding' },
        { url: 'https://ik.imagekit.io/clip.mp4' },
      ),
    ]);
    act(() => result.current.pickStock(pexelsItem({ id: '9', duration: 20, url: clipUrl })));

    await act(() => result.current.upload(RECT));

    expect(onUploaded).toHaveBeenCalledWith('https://ik.imagekit.io/clip.mp4');
  });

  it('keeps the selection and says so when the server returns no URL', async () => {
    const { result, onUploaded } = setup([
      uploadMock({ file: PNG_URL, fileName: 'logo.png', folder: 'branding' }, { url: null }),
    ]);
    await pickPng(result);

    await act(() => result.current.upload(null));

    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.selection).not.toBeNull();
    expect(await screen.findByText('Upload returned no URL')).toBeInTheDocument();
  });

  it('reports a failed import', async () => {
    const clipUrl = 'https://videos.pexels.com/9.mp4';
    const { result } = setup([
      importMock(
        { url: clipUrl, fileName: 'pexels-9.mp4', folder: 'branding' },
        { error: new Error('ImageKit is down') },
      ),
    ]);
    act(() => result.current.pickStock(pexelsItem({ id: '9', duration: 20, url: clipUrl })));

    await act(() => result.current.upload(null));

    expect(await screen.findByText('ImageKit is down')).toBeInTheDocument();
    expect(result.current.uploading).toBe(false);
  });

  it('falls back to a plain message for a failure that is not an Error', async () => {
    vi.spyOn(crop, 'cropImageToDataUrl').mockRejectedValue('canvas lost');
    const { result } = setup([]);
    await pickPng(result);

    await act(() => result.current.upload(RECT));

    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('ignores a second press while an upload is running', async () => {
    let release: (value: string) => void = () => undefined;
    const cropSpy = vi.spyOn(crop, 'cropImageToDataUrl').mockReturnValue(
      new Promise<string>((resolve) => {
        release = resolve;
      }),
    );
    const { result } = setup([
      uploadMock(
        { file: 'data:image/png;base64,Rg==', fileName: 'logo.png', folder: 'branding' },
        { url: CDN },
      ),
    ]);
    await pickPng(result);

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.upload(RECT);
    });
    expect(result.current.uploading).toBe(true);

    await act(() => result.current.upload(RECT));
    expect(cropSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      release('data:image/png;base64,Rg==');
      await first;
    });
    expect(result.current.uploading).toBe(false);
  });
});
