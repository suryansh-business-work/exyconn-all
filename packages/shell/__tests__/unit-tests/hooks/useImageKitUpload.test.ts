import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUploadImageMutation } from '@/graphql/generated';
import { MAX_IMAGE_BYTES } from '@/utils/file';
import { useImageKitUpload } from '@/hooks/useImageKitUpload';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useUploadImageMutation: vi.fn(),
}));

const uploadImage = vi.fn();

function setup(folder = 'branding') {
  return renderHook(() => useImageKitUpload(folder)).result.current;
}

function image(name: string, type: string, size?: number): File {
  const file = new File(['png-bytes'], name, { type });
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  return file;
}

beforeEach(() => {
  uploadImage.mockReset();
  vi.mocked(useUploadImageMutation).mockReturnValue([uploadImage] as unknown as ReturnType<
    typeof useUploadImageMutation
  >);
});

describe('useImageKitUpload', () => {
  it('uploads the image as a data URL into the folder and resolves to its URL', async () => {
    uploadImage.mockResolvedValue({ data: { uploadImage: 'https://ik.example.test/logo.png' } });
    const upload = setup('branding');

    await expect(upload(image('logo.png', 'image/png'))).resolves.toBe(
      'https://ik.example.test/logo.png',
    );

    expect(uploadImage).toHaveBeenCalledWith({
      variables: {
        file: expect.stringMatching(/^data:image\/png;base64,/),
        fileName: 'logo.png',
        folder: 'branding',
      },
    });
  });

  it('refuses a file that is not an image', async () => {
    const upload = setup();
    await expect(upload(image('notes.pdf', 'application/pdf'))).rejects.toThrow(
      'notes.pdf is not an image',
    );
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('refuses an image over the size limit', async () => {
    const upload = setup();
    await expect(upload(image('big.png', 'image/png', MAX_IMAGE_BYTES + 1))).rejects.toThrow(
      'Image must be 5 MB or smaller',
    );
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('accepts an image exactly at the limit', async () => {
    uploadImage.mockResolvedValue({ data: { uploadImage: 'https://ik.example.test/edge.png' } });
    const upload = setup();
    await expect(upload(image('edge.png', 'image/png', MAX_IMAGE_BYTES))).resolves.toBe(
      'https://ik.example.test/edge.png',
    );
  });

  it('rejects when the server returns no URL', async () => {
    uploadImage.mockResolvedValue({ data: { uploadImage: '' } });
    const upload = setup();
    await expect(upload(image('logo.png', 'image/png'))).rejects.toThrow('Upload returned no URL');
  });

  it('rejects when the server returns no data at all', async () => {
    uploadImage.mockResolvedValue({});
    const upload = setup();
    await expect(upload(image('logo.png', 'image/png'))).rejects.toThrow('Upload returned no URL');
  });

  it("passes the server's own error on", async () => {
    uploadImage.mockRejectedValue(new Error('ImageKit is not configured'));
    const upload = setup();
    await expect(upload(image('logo.png', 'image/png'))).rejects.toThrow(
      'ImageKit is not configured',
    );
  });
});
