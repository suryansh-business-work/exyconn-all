import { useUploadImageMutation } from '@/graphql/generated';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@/utils/file';

const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);

/**
 * Uploads one image file to ImageKit through the portal's `uploadImage` mutation and
 * resolves to its public URL. Rejects with a readable message — too large, not an
 * image, or the server's own error — for the caller to show.
 */
export function useImageKitUpload(folder: string): (file: File) => Promise<string> {
  const [uploadImage] = useUploadImageMutation();

  return async (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name} is not an image`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`Image must be ${MAX_MB} MB or smaller`);
    }
    const { data } = await uploadImage({
      variables: { file: await fileToDataUrl(file), fileName: file.name, folder },
    });
    if (!data?.uploadImage) {
      throw new Error('Upload returned no URL');
    }
    return data.uploadImage;
  };
}
