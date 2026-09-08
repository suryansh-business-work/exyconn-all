import { useRef, useState } from 'react';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Button, Chip, Stack, Text } from '@exyconn/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUploadImageMutation } from '@/graphql/generated';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@/utils/file';
import type { AttachmentItem } from './AttachmentList';

const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);
const PDF_MIME = 'application/pdf';
/** The upload path is the portal's image CDN, which also stores PDFs — and nothing else. */
const ACCEPT = `image/*,${PDF_MIME}`;

interface AttachmentPickerProps {
  value: readonly AttachmentItem[];
  onChange: (next: AttachmentItem[]) => void;
  /** Groups the uploads on the CDN, e.g. "support". */
  folder: string;
}

/**
 * Adds files to a message before it is sent. Each pick is uploaded straight away and
 * the field then holds only URLs, so the message itself stays small and a half-written
 * reply never carries megabytes of base64 around with it.
 *
 * Images and PDFs only: those are what the portal's upload path accepts, and saying so
 * up front is kinder than a rejection after the wait.
 */
export function AttachmentPicker({ value, onChange, folder }: Readonly<AttachmentPickerProps>) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadImage] = useUploadImageMutation();

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify(`A file must be ${MAX_MB} MB or smaller`, 'error');
      return;
    }
    setUploading(true);
    try {
      const { data } = await uploadImage({
        variables: { file: await fileToDataUrl(file), fileName: file.name, folder },
      });
      const url = data?.uploadImage;
      if (!url) {
        throw new Error('Upload returned no URL');
      }
      onChange([...value, { url, name: file.name, contentType: file.type }]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(value.filter((item) => item.url !== url));

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<AttachFileIcon />}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Attach file'}
        </Button>
        <Text size="caption" color="text.secondary">
          Images or PDF · up to {MAX_MB} MB
        </Text>
      </Stack>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        aria-label="Attach a file"
        onChange={pick}
        data-testid="attachment-input"
      />
      {value.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {value.map((item) => (
            <Chip key={item.url} label={item.name} size="small" onDelete={() => remove(item.url)} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
