import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Alert, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';

/** The redirect URI to register on the Entra app, read-only with a copy button. */
export function RedirectUriInfo({ uri }: Readonly<{ uri: string }>) {
  const t = useT();
  const notify = useNotify();
  const copy = () => {
    copyToClipboard(uri)
      .then((copied) => notify(copied ? 'Redirect URI copied' : 'Copy failed', 'info'))
      .catch(() => notify('Copy failed', 'info'));
  };
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Text size="sm" component="p">
        {t(
          'Register this exact address as a Web redirect URI on the Entra app (Authentication > Add a platform > Web), and grant it the Mail.Send, User.Read and offline_access delegated permissions:',
        )}
      </Text>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Text size="sm" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
          {uri}
        </Text>
        <Tooltip title={t('Copy the redirect URI')}>
          <IconButton size="small" aria-label={t('Copy the redirect URI')} onClick={copy}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
    </Alert>
  );
}
