import { useRef, useState, type DragEvent } from 'react';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { borderWidth, Box, Button, Chip, Stack, Text } from '@exyconn/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUploadImageMutation } from '@/graphql/generated';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@/utils/file';
import type { AttachmentItem } from './AttachmentList';

const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);
const PDF_MIME = 'application/pdf';
/** The upload path is the portal's image CDN, which also stores PDFs — and nothing else. */
const ACCEPT = `image/*,${PDF_MIME}`;

const isAccepted = (file: File) => file.type.startsWith('image/') || file.type === PDF_MIME;

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
 * Files are picked with the button or dropped anywhere on the dashed area. Images and PDFs
 * only: those are what the portal's upload path accepts, and saying so up front is kinder
 * than a rejection after the wait.
 */
export function AttachmentPicker({ value, onChange, folder }: Readonly<AttachmentPickerProps>) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadImage] = useUploadImageMutation();

  const uploadOne = async (file: File): Promise<AttachmentItem> => {
    const { data } = await uploadImage({
      variables: { file: await fileToDataUrl(file), fileName: file.name, folder },
    });
    const url = data?.uploadImage;
    if (!url) {
      throw new Error('Upload returned no URL');
    }
    return { url, name: file.name, contentType: file.type };
  };

  /** Uploads the files one by one, then adds every one that made it in a single change. */
  const upload = async (files: File[]) => {
    if (files.some((file) => !isAccepted(file))) {
      notify('Only images and PDF files can be attached', 'error');
      return;
    }
    if (files.some((file) => file.size > MAX_IMAGE_BYTES)) {
      notify('A file must be {mb} MB or smaller', 'error', { mb: MAX_MB });
      return;
    }
    setUploading(true);
    const added: AttachmentItem[] = [];
    try {
      for (const file of files) {
        added.push(await uploadOne(file));
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (added.length > 0) {
        onChange([...value, ...added]);
      }
    }
  };

  // upload() reports its own failures, so these handlers can simply wait for it.
  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length > 0) {
      await upload(files);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0 && !uploading) {
      await upload(files);
    }
  };

  const remove = (url: string) => onChange(value.filter((item) => item.url !== url));

  return (
    <Stack spacing={1}>
      <Box
        data-testid="attachment-dropzone"
        data-drag-over={dragOver || undefined}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        sx={{
          border: `${borderWidth.hairline}px dashed`,
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'transparent',
          borderRadius: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          textAlign: 'center',
        }}
      >
        <FileUploadOutlinedIcon color="action" aria-hidden />
        <Text size="sm">Drag and drop files here, or</Text>
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
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
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
