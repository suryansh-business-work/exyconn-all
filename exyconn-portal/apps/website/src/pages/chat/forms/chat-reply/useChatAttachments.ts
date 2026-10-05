import { useCallback, useState } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { CHAT_REPLY_LIMITS, type ChatReplyFile } from './chat-reply.types';

const MB = 1024 * 1024;

const isPictureOrClip = (file: File): boolean =>
  file.type.startsWith('image/') || file.type.startsWith('video/');

/**
 * The files attached to the reply being written: pictures and clips picked from the device and
 * voice notes recorded here, each checked against the size limit in the chatbot settings and
 * the four-files-per-message limit before it is read into a data URL.
 */
export function useChatAttachments(maxUploadMb: number) {
  const notify = useNotify();
  const [files, setFiles] = useState<ChatReplyFile[]>([]);

  const add = useCallback(
    (file: ChatReplyFile) =>
      setFiles((previous) => [...previous, file].slice(0, CHAT_REPLY_LIMITS.files)),
    [],
  );

  const tooMany = (adding: number) => files.length + adding > CHAT_REPLY_LIMITS.files;

  const pick = async (picked: readonly File[]) => {
    if (tooMany(picked.length)) {
      notify('Send at most {count} files with one message', 'warning', {
        count: CHAT_REPLY_LIMITS.files,
      });
      return;
    }
    for (const file of picked) {
      if (!isPictureOrClip(file)) {
        notify('Attach a picture or a video', 'warning');
        continue;
      }
      if (file.size > maxUploadMb * MB) {
        notify('{name} is larger than {size} MB', 'warning', {
          name: file.name,
          size: maxUploadMb,
        });
        continue;
      }
      const data = await fileToDataUrl(file);
      add({ id: globalThis.crypto.randomUUID(), name: file.name, data, size: file.size });
    }
  };

  return {
    files,
    canAddMore: files.length < CHAT_REPLY_LIMITS.files,
    add,
    pick: (picked: readonly File[]) => {
      pick(picked).catch((error: unknown) =>
        notify(errorMessage(error, 'Could not read that file'), 'error'),
      );
    },
    remove: (id: string) => setFiles((previous) => previous.filter((file) => file.id !== id)),
    clear: () => setFiles([]),
  };
}
