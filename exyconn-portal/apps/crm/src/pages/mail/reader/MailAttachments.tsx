import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useT } from '@exyconn/i18n';
import { Box, Chip, Flex } from '@exyconn/shell/components/ui';
import { useCrmMailAttachmentLazyQuery } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { downloadBase64File, formatBytes } from '@exyconn/shell/utils/file';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { MailMessage } from '../mailCompose';

type Attachment = MailMessage['attachments'][number];

interface MailAttachmentsProps {
  accountId: string;
  attachments: Attachment[];
}

/** A message's attached files; each downloads through the server, which asks Gmail for it. */
export function MailAttachments({ accountId, attachments }: Readonly<MailAttachmentsProps>) {
  const t = useT();
  const notify = useNotify();
  const [fetchFile, { loading }] = useCrmMailAttachmentLazyQuery({ fetchPolicy: 'no-cache' });
  if (attachments.length === 0) {
    return null;
  }

  const download = async (file: Attachment) => {
    try {
      const { data, error } = await fetchFile({
        variables: { accountId, messageId: file.messageId, attachmentId: file.id },
      });
      if (!data) {
        throw error ?? new Error('The attachment could not be downloaded.');
      }
      downloadBase64File(file.filename, file.mimeType, data.crmMailAttachment.data);
    } catch (error) {
      portalLogger.warn('crm: downloading a mail attachment failed', error);
      notify(errorMessage(error, 'The attachment could not be downloaded.'), 'error');
    }
  };

  return (
    <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap component="ul" sx={{ p: 0, m: 0 }}>
      {attachments.map((file) => (
        <Box component="li" key={`${file.messageId}:${file.id}`} sx={{ listStyle: 'none' }}>
          <Chip
            icon={<AttachFileIcon />}
            label={`${file.filename} (${formatBytes(file.size)})`}
            onClick={() => {
              download(file).catch((error: unknown) =>
                portalLogger.warn('crm: attachment download failed', error),
              );
            }}
            disabled={loading}
            aria-label={t('Download {name}', { name: file.filename })}
            variant="outlined"
          />
        </Box>
      ))}
    </Flex>
  );
}
