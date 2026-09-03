import { useRef, useState } from 'react';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUploadImageMutation } from '@/graphql/generated';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@/utils/file';

export const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);

/**
 * The "from your device" half of the upload dialog: reads the picked file as a data
 * URL for the preview, then pushes it through the single `uploadImage` mutation
 * (ImageKit) and hands back the hosted URL.
 */
export function useDeviceUpload(folder: string | undefined, onUploaded: (url: string) => void) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadImage] = useUploadImageMutation();

  const reset = () => {
    setFile(null);
    setPreview(null);
  };

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      notify(`Image must be ${MAX_MB} MB or smaller`, 'error');
      return;
    }
    try {
      setPreview(await fileToDataUrl(picked));
      setFile(picked);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not read the file', 'error');
    }
  };

  const upload = async () => {
    if (!file || !preview) return;
    setUploading(true);
    try {
      const { data } = await uploadImage({
        variables: { file: preview, fileName: file.name, folder },
      });
      const url = data?.uploadImage;
      if (!url) throw new Error('Upload returned no URL');
      notify('Image uploaded');
      onUploaded(url);
      reset();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return { inputRef, file, preview, uploading, pick, upload, reset };
}
