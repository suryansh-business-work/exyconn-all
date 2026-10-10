import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import * as fileUtils from '@/utils/file';
import { isCroppable, useMediaUpload } from '@/components/ui/ImageUploadDialog/useMediaUpload';
import { dataUrlOf, fileEvent, mediaWrapper } from './mediaHarness';
import { pexelsItem } from './fixtures';

const pngFile = () => new File(['png-bytes'], 'logo.png', { type: 'image/png' });

function setup() {
  const onUploaded = vi.fn();
  const hook = renderHook(() => useMediaUpload('branding', onUploaded), {
    wrapper: mediaWrapper([]),
  });
  return { onUploaded, ...hook };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useMediaUpload picking', () => {
  it('ignores a picker closed without a file', async () => {
    const { result } = setup();
    const event = fileEvent();

    await act(() => result.current.pickFile(event));

    expect(result.current.selection).toBeNull();
    expect(event.target.value).toBe('');
  });

  it('refuses a file over the size limit', async () => {
    const { result } = setup();
    const big = pngFile();
    Object.defineProperty(big, 'size', { value: fileUtils.MAX_IMAGE_BYTES + 1 });

    await act(() => result.current.pickFile(fileEvent(big)));

    expect(result.current.selection).toBeNull();
    expect(await screen.findByText('Image must be 5 MB or smaller')).toBeInTheDocument();
  });

  it('selects a raster file for cropping, and resets the input so it can be re-picked', async () => {
    const { result } = setup();
    const event = fileEvent(pngFile());

    await act(() => result.current.pickFile(event));

    expect(event.target.value).toBe('');
    expect(result.current.selection).toEqual({
      previewUrl: dataUrlOf('image/png', 'png-bytes'),
      fileName: 'logo.png',
      mimeType: 'image/png',
      isVideo: false,
      isVector: false,
    });
    expect(isCroppable(result.current.selection)).toBe(true);
  });

  it('selects an SVG as a vector that skips the crop step', async () => {
    const { result } = setup();

    await act(() =>
      result.current.pickFile(
        fileEvent(new File(['<svg/>'], 'mark.svg', { type: 'image/svg+xml' })),
      ),
    );

    expect(result.current.selection).toMatchObject({ isVector: true, mimeType: 'image/svg+xml' });
    expect(isCroppable(result.current.selection)).toBe(false);
  });

  it('says why a file could not be read', async () => {
    vi.spyOn(fileUtils, 'fileToDataUrl').mockRejectedValueOnce(new Error('File is locked'));
    const { result } = setup();

    await act(() => result.current.pickFile(fileEvent(pngFile())));

    expect(result.current.selection).toBeNull();
    expect(await screen.findByText('File is locked')).toBeInTheDocument();
  });

  it('falls back to a plain message for a read failure that is not an Error', async () => {
    vi.spyOn(fileUtils, 'fileToDataUrl').mockRejectedValueOnce('aborted');
    const { result } = setup();

    await act(() => result.current.pickFile(fileEvent(pngFile())));

    expect(await screen.findByText('Could not read the file')).toBeInTheDocument();
  });

  it('turns a stock photo into a JPEG selection of its full file', () => {
    const { result } = setup();

    act(() => result.current.pickStock(pexelsItem()));

    expect(result.current.selection).toEqual({
      previewUrl: 'https://images.pexels.com/101/full.jpg',
      fileName: 'pexels-101.jpg',
      mimeType: 'image/jpeg',
      isVideo: false,
      isVector: false,
      stockUrl: 'https://images.pexels.com/101/full.jpg',
    });
  });

  it('turns a stock clip into an uncroppable MP4 that keeps its poster, and clears', () => {
    const { result } = setup();

    act(() =>
      result.current.pickStock(
        pexelsItem({ id: '9', duration: 12, url: 'https://videos.pexels.com/9.mp4' }),
      ),
    );

    expect(result.current.selection).toMatchObject({
      previewUrl: 'https://images.pexels.com/101/small.jpg',
      fileName: 'pexels-9.mp4',
      mimeType: 'video/mp4',
      isVideo: true,
      stockUrl: 'https://videos.pexels.com/9.mp4',
    });
    expect(isCroppable(result.current.selection)).toBe(false);

    act(() => result.current.clear());
    expect(result.current.selection).toBeNull();
  });
});
