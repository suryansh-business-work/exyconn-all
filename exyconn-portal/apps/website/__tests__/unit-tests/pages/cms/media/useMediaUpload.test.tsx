import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaUpload } from '../../../../../src/pages/cms/media';
import { MAX_MEDIA_BYTES, MEDIA_ACCEPT } from '../../../../../src/pages/cms/media/useMediaUpload';

const gql = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUploadCmsAssetMutation: () => [gql.upload],
}));

/** An <img> that "loads" its source a tick later; a `broken` source fails instead. */
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readonly naturalWidth = 640;
  readonly naturalHeight = 480;

  set src(value: string) {
    queueMicrotask(() => {
      if (value.includes('broken')) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    });
  }
}

const file = (name: string, type: string, size?: number) => {
  const made = new File(['hi'], name, { type });
  if (size !== undefined) Object.defineProperty(made, 'size', { value: size });
  return made;
};

const uploadWith = () => renderHook(() => useMediaUpload('site-1')).result.current;
const sentInput = () => gql.upload.mock.calls[0][0].variables.input;

describe('useMediaUpload', () => {
  beforeEach(() => {
    gql.upload.mockReset();
    gql.upload.mockResolvedValue({ data: { uploadCmsAsset: { url: 'https://cdn/stored.png' } } });
    vi.stubGlobal('Image', FakeImage);
    URL.createObjectURL = vi.fn((blob: Blob) =>
      blob instanceof File && blob.name.includes('broken') ? 'blob:broken' : 'blob:ok',
    );
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('holds images and PDFs up to 12 MB', () => {
    expect(MEDIA_ACCEPT).toBe('image/*,application/pdf');
    expect(MAX_MEDIA_BYTES).toBe(12 * 1024 * 1024);
  });

  it('uploads an image with its pixel size and resolves to the stored URL', async () => {
    await expect(uploadWith()(file('logo.png', 'image/png'))).resolves.toBe(
      'https://cdn/stored.png',
    );

    expect(sentInput()).toEqual({
      siteId: 'site-1',
      file: 'data:image/png;base64,aGk=',
      fileName: 'logo.png',
      width: 640,
      height: 480,
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ok');
  });

  it('sends 0×0 for an image the browser cannot read', async () => {
    await uploadWith()(file('broken.png', 'image/png'));

    expect(sentInput()).toMatchObject({ width: 0, height: 0 });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:broken');
  });

  it('sends 0×0 for a PDF without reading it as an image', async () => {
    await uploadWith()(file('brochure.pdf', 'application/pdf'));

    expect(sentInput()).toMatchObject({ fileName: 'brochure.pdf', width: 0, height: 0 });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('refuses a file that is not an image or a PDF', async () => {
    await expect(uploadWith()(file('notes.txt', 'text/plain'))).rejects.toThrow(
      'notes.txt is not an image or a PDF',
    );
    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('refuses a file over the cap', async () => {
    const big = file('poster.png', 'image/png', MAX_MEDIA_BYTES + 1);
    await expect(uploadWith()(big)).rejects.toThrow('poster.png is larger than 12 MB');
  });

  it('rejects when the server returns no file', async () => {
    gql.upload.mockResolvedValue({ data: null });
    await expect(uploadWith()(file('brochure.pdf', 'application/pdf'))).rejects.toThrow(
      'The upload returned no file',
    );
  });
});
