import { describe, expect, it, vi } from 'vitest';
import type { Editor } from 'grapesjs';
import { assetUploader } from '../../src/asset-upload';
import { dropOf, imageFile } from './grapes-fake';

const fakeEditor = () => {
  const add = vi.fn();
  return { add, editor: { AssetManager: { add } } as unknown as Editor };
};

describe('assetUploader edge cases', () => {
  it('uploads nothing when the event carries no files at all', async () => {
    const { add, editor } = fakeEditor();
    const upload = vi.fn(async () => 'https://ik.imagekit.io/x/a.png');
    await assetUploader(() => editor, upload, vi.fn())({ target: null } as unknown as DragEvent);
    expect(upload).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('reads the picker when the drop has no file list', async () => {
    const { add, editor } = fakeEditor();
    const event = {
      dataTransfer: {},
      target: { files: [imageFile('picked.png')] },
    } as unknown as DragEvent;
    await assetUploader(
      () => editor,
      async (file) => `https://cdn/${file.name}`,
      vi.fn(),
    )(event);
    expect(add).toHaveBeenCalledWith(['https://cdn/picked.png']);
  });

  it('reports a generic message when the upload rejects with a non-Error', async () => {
    const onError = vi.fn();
    const upload = vi.fn<(file: File) => Promise<string>>().mockRejectedValue('quota exceeded');
    await assetUploader(() => null, upload, onError)(dropOf(imageFile('a.png')));
    expect(onError).toHaveBeenCalledWith('Upload failed');
  });

  it('drops the uploaded URLs quietly when the editor is already gone', async () => {
    const getEditor = vi.fn(() => null);
    const onError = vi.fn();
    await assetUploader(
      getEditor,
      async () => 'https://cdn/a.png',
      onError,
    )(dropOf(imageFile('a.png')));
    expect(getEditor).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});
