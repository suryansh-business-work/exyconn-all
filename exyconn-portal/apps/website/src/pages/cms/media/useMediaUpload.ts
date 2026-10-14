import { useUploadCmsAssetMutation } from '@exyconn/shell/graphql/generated';
import { fileToDataUrl } from '@exyconn/shell/utils/file';

/** The server's cap on one media file (the shared upload policy). */
export const MAX_MEDIA_BYTES = 12 * 1024 * 1024;
const MAX_MEDIA_MB = MAX_MEDIA_BYTES / (1024 * 1024);
/** What a site's media library holds. */
export const MEDIA_ACCEPT = 'image/*,application/pdf';

const isAccepted = (file: File) =>
  file.type.startsWith('image/') || file.type === 'application/pdf';

/** An image's pixel size, read in the browser so the library can show it; 0×0 for a PDF. */
function imageSize(file: File): Promise<{ width: number; height: number }> {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve({ width: 0, height: 0 });
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

/**
 * Uploads one file into a site's media library and resolves to the stored asset's URL.
 * Rejects with a message the editor can act on: too large, or not an image or PDF.
 */
export function useMediaUpload(siteId: string): (file: File) => Promise<string> {
  const [upload] = useUploadCmsAssetMutation();

  return async (file: File) => {
    if (!isAccepted(file)) {
      throw new Error(`${file.name} is not an image or a PDF`);
    }
    if (file.size > MAX_MEDIA_BYTES) {
      throw new Error(`${file.name} is larger than ${MAX_MEDIA_MB} MB`);
    }
    const [dataUrl, size] = await Promise.all([fileToDataUrl(file), imageSize(file)]);
    const { data } = await upload({
      variables: { input: { siteId, file: dataUrl, fileName: file.name, ...size } },
    });
    if (!data?.uploadCmsAsset) {
      throw new Error('The upload returned no file');
    }
    return data.uploadCmsAsset.url;
  };
}

/**
 * The site library as the shared upload dialog's destination: the cropped image (a data URL)
 * goes through the same checks and into the same library as a file dropped on Media.
 */
export function useMediaDataUrlUpload(
  siteId: string,
): (dataUrl: string, fileName: string) => Promise<string> {
  const upload = useMediaUpload(siteId);
  return async (dataUrl, fileName) => {
    const blob = await (await fetch(dataUrl)).blob();
    return upload(new File([blob], fileName, { type: blob.type }));
  };
}
