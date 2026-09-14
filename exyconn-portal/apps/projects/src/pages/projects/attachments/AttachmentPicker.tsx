import { useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_MB } from './attachment.constants';
import { useAttachmentUpload, type PickedAttachment } from './useAttachmentUpload';

interface AttachmentPickerProps {
  label?: string;
  /** Hides the "images or PDF" line where it would repeat one already on screen. */
  showHelp?: boolean;
  onPicked: (file: PickedAttachment) => Promise<void> | void;
}

/** The one control that puts a file on a ticket or a comment, and says what it accepts. */
export function AttachmentPicker({
  label = 'Attach a file',
  showHelp = true,
  onPicked,
}: Readonly<AttachmentPickerProps>) {
  const t = useT();
  const upload = useAttachmentUpload(onPicked);

  return (
    <Box>
      <input
        ref={upload.inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        hidden
        onChange={upload.pick}
        data-testid="attachment-input"
      />
      <Button
        size="small"
        startIcon={<AttachFileIcon />}
        onClick={upload.open}
        disabled={upload.uploading}
      >
        {upload.uploading ? t('Uploading…') : t(label)}
      </Button>
      {showHelp ? (
        <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
          {t('Images or PDF · up to {mb} MB each', { mb: MAX_ATTACHMENT_MB })}
        </Text>
      ) : null}
    </Box>
  );
}
