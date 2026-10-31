import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useT } from '@exyconn/i18n';
import { Box, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { CHECK_LABELS, STATUS_VIEW, type DomainHealthCheck } from './mailHealth';

const mono = { fontFamily: 'monospace', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' } as const;

/** A DNS value to paste in, with a copy button. */
function SuggestedValue({ value }: Readonly<{ value: string }>) {
  const t = useT();
  const notify = useNotify();
  const copy = () => {
    copyToClipboard(value)
      .then((copied) =>
        notify(
          copied ? t('Record copied') : t('Could not copy: your browser blocked the clipboard'),
          copied ? 'success' : 'error',
        ),
      )
      .catch(() => notify(t('Could not copy: your browser blocked the clipboard'), 'error'));
  };
  return (
    <Flex direction="row" alignItems="center" spacing={1}>
      <Text size="sm" sx={mono}>
        {value}
      </Text>
      <Tooltip title={t('Copy the record')}>
        <IconButton size="small" aria-label={t('Copy the record')} onClick={copy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}

/** One check: its outcome, what was found and, when it is not a pass, how to fix it. */
export function HealthCheckItem({ check }: Readonly<{ check: DomainHealthCheck }>) {
  const t = useT();
  const view = STATUS_VIEW[check.status];
  const Icon = view.Icon;
  const iconColor = view.color === 'default' ? 'text.secondary' : `${view.color}.main`;
  return (
    <Flex direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{ color: iconColor, display: 'flex', pt: 0.5 }}
        role="img"
        aria-label={t(view.label)}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Text weight="semibold">{t(CHECK_LABELS[check.code])}</Text>
        <Text size="sm">{t(check.message)}</Text>
        {check.record && (
          <Text size="sm" color="text.secondary" sx={mono}>
            {check.record}
          </Text>
        )}
        {check.fix && (
          <Text size="sm" sx={{ mt: 0.5 }}>
            {check.fix
              .split('\n')
              .map((line) => t(line))
              .join(' ')}
          </Text>
        )}
        {check.suggested && <SuggestedValue value={check.suggested} />}
      </Box>
    </Flex>
  );
}
