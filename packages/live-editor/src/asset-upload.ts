import type { Editor, UploadFileFn } from 'grapesjs';
import type { UploadImage } from './types';

/** The files of an asset-manager drop, or of its file picker. */
const filesOf = (event: DragEvent): File[] => {
  const picker = event.target as HTMLInputElement | null;
  const list = event.dataTransfer?.files ?? picker?.files;
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));
};

const reasonOf = (result: PromiseRejectedResult): string =>
  result.reason instanceof Error ? result.reason.message : 'Upload failed';

/**
 * GrapesJS `uploadFile` hook: sends each picked or dropped image through the host's
 * uploader (ImageKit in the portal) and adds the resulting URLs to the asset manager.
 * Without it GrapesJS would inline the images as base64 into the article.
 */
export function assetUploader(
  getEditor: () => Editor | null,
  upload: UploadImage,
  onError: (message: string) => void,
): UploadFileFn {
  return async (event) => {
    const results = await Promise.allSettled(filesOf(event).map(upload));
    const urls: string[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        urls.push(result.value);
      } else {
        onError(reasonOf(result));
      }
    }
    if (urls.length > 0) {
      getEditor()?.AssetManager.add(urls);
    }
  };
}
