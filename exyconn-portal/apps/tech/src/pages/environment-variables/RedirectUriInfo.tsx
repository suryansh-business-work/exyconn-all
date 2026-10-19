import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Alert, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';

interface RedirectUriInfoProps {
  uri: string;
  /** Where to register it and what else the provider's app needs, as an English source string. */
  instructions: string;
}

/** The redirect URI to register on an OAuth app, read-only with a copy button. */
export function RedirectUriInfo({ uri, instructions }: Readonly<RedirectUriInfoProps>) {
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
        {t(instructions)}
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
