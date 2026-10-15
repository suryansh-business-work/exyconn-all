import { useT } from '@exyconn/i18n';
import {
  Box,
  Flex,
  IconButton,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  fontSize,
} from '@exyconn/shell/components/ui';
import LockIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TaskVisibility } from '@exyconn/shell/graphql/generated';

interface TicketVisibilityControlProps {
  visibility: TaskVisibility;
  publicUrl: string | null;
  disabled: boolean;
  onChange: (visibility: TaskVisibility) => void;
  onCopy: (url: string) => void;
}

/**
 * Private or public, and — once public — the link that opens it. The link is shown in full
 * so whoever made the ticket public can see exactly what they are handing out.
 */
export function TicketVisibilityControl({
  visibility,
  publicUrl,
  disabled,
  onChange,
  onCopy,
}: Readonly<TicketVisibilityControlProps>) {
  const t = useT();
  return (
    <Box>
      <Text size="overline" color="text.secondary" sx={{ display: 'block' }}>
        {t('Visibility')}
      </Text>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={visibility}
        disabled={disabled}
        aria-label={t('Who can read this ticket')}
        onChange={(_event, next: TaskVisibility | null) => {
          if (next) {
            onChange(next);
          }
        }}
        sx={{ mt: 0.5 }}
      >
        <ToggleButton value={TaskVisibility.Private}>
          <LockIcon fontSize="small" sx={{ mr: 0.5 }} />
          {t('Private')}
        </ToggleButton>
        <ToggleButton value={TaskVisibility.Public}>
          <PublicIcon fontSize="small" sx={{ mr: 0.5 }} />
          {t('Public')}
        </ToggleButton>
      </ToggleButtonGroup>
      <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {visibility === TaskVisibility.Public
          ? t('Anyone with the link can read it — no comments, history or files.')
          : t('Only people signed in to Projects can open it.')}
      </Text>
      {publicUrl ? (
        <Flex direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              p: 1,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontFamily: 'monospace',
              fontSize: fontSize.xs,
              wordBreak: 'break-all',
            }}
          >
            {publicUrl}
          </Box>
          <Tooltip title={t('Copy public link')}>
            <IconButton
              size="small"
              aria-label={t('Copy public link')}
              onClick={() => onCopy(publicUrl)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Flex>
      ) : null}
    </Box>
  );
}
