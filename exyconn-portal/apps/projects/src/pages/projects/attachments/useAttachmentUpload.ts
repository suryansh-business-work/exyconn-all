import { useCallback, useRef, useState } from 'react';
import { useUploadImageMutation } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ATTACHMENT_FOLDER,
  ATTACHMENT_HELP,
  MAX_ATTACHMENT_BYTES,
  isAllowedAttachment,
} from './attachment.constants';

/** An attachment as the ticket mutations take it. The uploader is stamped server-side. */
export interface PickedAttachment {
  url: string;
  name: string;
  contentType: string;
}

/**
 * Picking a file and putting it on ImageKit, through the portal's one upload mutation.
 *
 * Deliberately not the shared `ImageUploadDialog`: that dialog exists to crop a single
 * image into a field, and it rejects anything that is not an image. A ticket attachment is
 * a file on a list, and a PDF is half of what people attach.
 */
export function useAttachmentUpload(onUploaded: (file: PickedAttachment) => Promise<void> | void) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadImage] = useUploadImageMutation();

  const open = useCallback(() => inputRef.current?.click(), []);

  const pick = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files?.[0];
      event.target.value = '';
      if (!picked || uploading) {
        return;
      }
      if (!isAllowedAttachment(picked.type)) {
        notify(ATTACHMENT_HELP, 'error');
        return;
      }
      if (picked.size > MAX_ATTACHMENT_BYTES) {
        notify(ATTACHMENT_HELP, 'error');
        return;
      }
      setUploading(true);
      try {
        const { data } = await uploadImage({
          variables: {
            file: await fileToDataUrl(picked),
            fileName: picked.name,
            folder: ATTACHMENT_FOLDER,
          },
        });
        if (!data?.uploadImage) {
          throw new Error('Upload returned no URL');
        }
        await onUploaded({ url: data.uploadImage, name: picked.name, contentType: picked.type });
      } catch (error) {
        notify(errorMessage(error, 'Upload failed'), 'error');
      } finally {
        setUploading(false);
      }
    },
    [uploading, notify, uploadImage, onUploaded],
  );

  return { inputRef, uploading, open, pick };
}
