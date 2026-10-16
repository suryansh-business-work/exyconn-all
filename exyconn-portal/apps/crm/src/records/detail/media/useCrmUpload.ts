import { useState } from 'react';
import { useUploadCrmMediaMutation } from '@exyconn/shell/graphql/generated';

/** The server's own limit for a CRM file (see CRM_MEDIA_UPLOAD). */
export const CRM_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

export interface UploadedFile {
  url: string;
  name: string;
  contentType: string;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });

/** Sends one file to the CDN through uploadCrmMedia and says where it landed. */
export function useCrmUpload() {
  const [upload] = useUploadCrmMediaMutation();
  const [uploading, setUploading] = useState(false);

  const send = async (file: File): Promise<UploadedFile> => {
    if (file.size > CRM_MEDIA_MAX_BYTES) {
      throw new Error('Files can be 10 MB at most.');
    }
    setUploading(true);
    try {
      const { data } = await upload({
        variables: { file: await readAsDataUrl(file), fileName: file.name },
      });
      return { url: data?.uploadCrmMedia ?? '', name: file.name, contentType: file.type };
    } finally {
      setUploading(false);
    }
  };

  return { send, uploading };
}
