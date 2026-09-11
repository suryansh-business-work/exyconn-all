import type { Editor } from '@tiptap/core';
import type { UploadImage } from '../types';
import { altFromFileName } from '../forms/image';

/** The images among the files of a paste or a drop. */
export const imageFilesOf = (data: DataTransfer | null): File[] =>
  Array.from(data?.files ?? []).filter((file) => file.type.startsWith('image/'));

/**
 * Uploads each file and inserts it as an image — at `position` for a drop, at the caret
 * for a paste. Files upload in parallel; each lands as soon as its own upload finishes.
 */
export function insertUploadedImages(
  editor: Editor,
  files: readonly File[],
  upload: UploadImage,
  position?: number,
): Promise<void>[] {
  return files.map(async (file) => {
    const src = await upload(file);
    const image = { type: 'image', attrs: { src, alt: altFromFileName(file.name) } };
    if (position === undefined) {
      editor.chain().focus().insertContent(image).run();
    } else {
      editor.chain().focus().insertContentAt(position, image).run();
    }
  });
}
