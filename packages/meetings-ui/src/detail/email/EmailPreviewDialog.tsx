import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import { useMaEmailPreviewQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../../lib/LoadError';

interface EmailPreviewDialogProps {
  meetingId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * The summary email exactly as it would be sent. The HTML renders in a sandboxed frame with
 * no script, form or same-origin rights, so nothing in it can act on the portal.
 */
export function EmailPreviewDialog({
  meetingId,
  open,
  onClose,
}: Readonly<EmailPreviewDialogProps>) {
  const t = useT();
  const { data, error, refetch } = useMaEmailPreviewQuery({
    variables: { meetingId },
    skip: !open,
    fetchPolicy: 'network-only',
  });
  const preview = data?.maEmailPreview;

  let body;
  if (error) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (preview) {
    body = (
      <>
        <Text weight="semibold" sx={{ display: 'block' }}>
          {preview.subject}
        </Text>
        <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {t('To: {recipients}', { recipients: preview.recipients.join(', ') || t('nobody yet') })}
        </Text>
        <Box
          component="iframe"
          title={t('Email preview')}
          sandbox=""
          srcDoc={preview.html}
          sx={{
            width: '100%',
            height: 480,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'common.white',
          }}
        />
      </>
    );
  } else {
    body = <Skeleton variant="rounded" height={480} />;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('Summary email preview')}</DialogTitle>
      <DialogContent>{body}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
