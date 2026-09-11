import { describe, expect, it, vi } from 'vitest';
import type { Editor } from 'grapesjs';
import { assetUploader } from '../../src/asset-upload';

const file = (name: string, type: string) => new File(['x'], name, { type });

const dropOf = (files: File[]) => ({ dataTransfer: { files } }) as unknown as DragEvent;

const fakeEditor = () => {
  const add = vi.fn();
  return { add, editor: { AssetManager: { add } } as unknown as Editor };
};

describe('assetUploader', () => {
  it('uploads each dropped image and adds the URLs to the asset manager', async () => {
    const { add, editor } = fakeEditor();
    const upload = vi.fn(async (picked: File) => `https://ik.imagekit.io/x/${picked.name}`);
    await assetUploader(
      () => editor,
      upload,
      vi.fn(),
    )(dropOf([file('a.png', 'image/png'), file('b.jpg', 'image/jpeg')]));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenCalledWith([
      'https://ik.imagekit.io/x/a.png',
      'https://ik.imagekit.io/x/b.jpg',
    ]);
  });

  it('ignores files that are not images', async () => {
    const { add, editor } = fakeEditor();
    const upload = vi.fn(async () => 'https://ik.imagekit.io/x/a.png');
    await assetUploader(
      () => editor,
      upload,
      vi.fn(),
    )(dropOf([file('notes.pdf', 'application/pdf')]));
    expect(upload).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('reports a failed upload and still adds the ones that worked', async () => {
    const { add, editor } = fakeEditor();
    const onError = vi.fn();
    const upload = vi.fn(async (picked: File) => {
      if (picked.name === 'big.png') {
        throw new Error('Image must be 5 MB or smaller');
      }
      return `https://ik.imagekit.io/x/${picked.name}`;
    });
    await assetUploader(
      () => editor,
      upload,
      onError,
    )(dropOf([file('big.png', 'image/png'), file('ok.png', 'image/png')]));
    expect(onError).toHaveBeenCalledWith('Image must be 5 MB or smaller');
    expect(add).toHaveBeenCalledWith(['https://ik.imagekit.io/x/ok.png']);
  });

  it('reads the file picker when there is no drop', async () => {
    const { add, editor } = fakeEditor();
    const picker = { target: { files: [file('c.webp', 'image/webp')] } } as unknown as DragEvent;
    await assetUploader(
      () => editor,
      async () => 'https://ik.imagekit.io/x/c.webp',
      vi.fn(),
    )(picker);
    expect(add).toHaveBeenCalledWith(['https://ik.imagekit.io/x/c.webp']);
  });
});
