import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Text,
} from '@/components/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { copyToClipboard } from '@/utils/clipboard';
import { portalLogger } from '@/logging/portalLogger';
import { describeMailboxError } from './mailboxError';

/** What the dialog reads of a mailbox (a company's CRM mailbox or a person's own). */
export interface MailboxErrorRow {
  email: string;
  lastError: string;
  lastErrorAt?: string | null;
}

interface MailboxErrorDialogProps {
  /** The mailbox whose last error is shown; the dialog is closed while null. */
  row: MailboxErrorRow | null;
  onClose: () => void;
}

const TITLE_ID = 'mailbox-error-title';

/** What to do about a recognised error, with the provider's own link when it gave one. */
function HowToFix({ fix, url }: Readonly<{ fix: string; url?: string }>) {
  const t = useT();
  return (
    <Box>
      <Text weight="semibold">{t('How to fix')}</Text>
      <Text>{t(fix)}</Text>
      {url && (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ overflowWrap: 'anywhere' }}
        >
          {url}
        </Link>
      )}
    </Box>
  );
}

/** The full text of a mailbox's last error, when it happened, how to fix it, and Copy. */
export function MailboxErrorDialog({ row, onClose }: Readonly<MailboxErrorDialogProps>) {
  const t = useT();
  const notify = useNotify();
  const { formatDateTime } = useFormatters();
  const lastError = row?.lastError ?? '';
  const error = lastError ? describeMailboxError(lastError) : undefined;

  const copy = async (text: string) => {
    const copied = await copyToClipboard(text);
    notify(
      copied ? t('Error copied') : t('Could not copy: your browser blocked the clipboard'),
      copied ? 'success' : 'error',
    );
  };

  return (
    <Dialog open={Boolean(row && error)} onClose={onClose} aria-labelledby={TITLE_ID} fullWidth>
      <DialogTitle id={TITLE_ID}>{t('Error details')}</DialogTitle>
      {row && error && (
        <DialogContent>
          <Stack spacing={2}>
            <Text color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {row.email}
              {row.lastErrorAt && ` · ${formatDateTime(row.lastErrorAt)}`}
            </Text>
            {error.fix && <HowToFix fix={error.fix} url={error.fixUrl} />}
            <Box
              component="pre"
              role="region"
              tabIndex={0}
              aria-label={t('Full error')}
              sx={{
                m: 0,
                p: 1.5,
                maxHeight: 320,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                typography: 'body2',
                fontFamily: 'monospace',
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              {error.details}
            </Box>
          </Stack>
        </DialogContent>
      )}
      <DialogActions>
        {error && (
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              copy(lastError).catch((failure: unknown) =>
                portalLogger.warn('mailbox: copying a mailbox error failed', failure),
              );
            }}
          >
            {t('Copy')}
          </Button>
        )}
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
