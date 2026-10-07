import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { buildExtensions } from '../../../src/extensions';
import { imageFilesOf, insertUploadedImages } from '../../../src/RichTextEditor/image-files';

let editor: Editor | null = null;

const create = (content: string): Editor => {
  editor = new Editor({ extensions: buildExtensions(''), content });
  return editor;
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

const png = (name: string) => new File(['x'], name, { type: 'image/png' });
const transfer = (files: File[]) => ({ files }) as unknown as DataTransfer;

describe('imageFilesOf', () => {
  it('keeps only the images of a paste or drop', () => {
    const photo = png('photo.png');
    const notes = new File(['x'], 'notes.txt', { type: 'text/plain' });
    expect(imageFilesOf(transfer([notes, photo]))).toEqual([photo]);
  });

  it('returns nothing when there is no data', () => {
    expect(imageFilesOf(null)).toEqual([]);
    expect(imageFilesOf(transfer([]))).toEqual([]);
  });
});

describe('insertUploadedImages', () => {
  it('uploads each file and inserts it at the caret with alt text from its name', async () => {
    const target = create('<p>Hello</p>');
    const upload = vi.fn(async (file: File) => `https://x.test/${file.name}`);
    await Promise.all(insertUploadedImages(target, [png('team-photo.png')], upload));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(target.getHTML()).toContain(
      '<img src="https://x.test/team-photo.png" alt="team photo">',
    );
  });

  it('inserts a dropped image at the drop position', async () => {
    const target = create('<p>First</p><p>Second</p>');
    const upload = vi.fn(async () => 'https://x.test/a.png');
    const endOfDoc = target.state.doc.content.size;
    await Promise.all(insertUploadedImages(target, [png('a.png')], upload, endOfDoc));
    const html = target.getHTML();
    expect(html.indexOf('Second')).toBeLessThan(html.indexOf('<img'));
  });

  it('rejects that file and inserts nothing when its upload fails', async () => {
    const target = create('<p>Hello</p>');
    const upload = vi.fn(async () => Promise.reject(new Error('Quota exceeded')));
    const [result] = insertUploadedImages(target, [png('a.png')], upload);
    await expect(result).rejects.toThrow('Quota exceeded');
    expect(target.getHTML()).toBe('<p>Hello</p>');
  });
});
