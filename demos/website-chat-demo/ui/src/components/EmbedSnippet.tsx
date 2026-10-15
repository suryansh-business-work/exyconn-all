import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, Chip, Paper, Typography } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

interface EmbedSnippetProps {
  snippet: string;
  platforms: readonly string[];
}

/** The one line a client pastes into their site, with a Copy button, and where it works. */
export function EmbedSnippet({ snippet, platforms }: Readonly<EmbedSnippetProps>) {
  const t = useT();
  const notify = useNotify();
  const copy = () => {
    globalThis.navigator.clipboard
      .writeText(snippet)
      .then(() => notify(t('Snippet copied'), 'success'))
      .catch((error: unknown) => {
        portalLogger.warn('website chat demo: copy failed', error);
        notify(t('Could not copy. Select the text and copy it instead.'), 'error');
      });
  };
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t('Example install snippet')}
          </Typography>
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
            {t('Copy')}
          </Button>
        </Box>
        <Box
          component="pre"
          role="region"
          tabIndex={0}
          aria-label={t('Example install snippet')}
          sx={{
            m: 0,
            p: 2,
            overflowX: 'auto',
            fontFamily: 'monospace',
            fontSize: 'body2.fontSize',
            bgcolor: 'action.hover',
          }}
        >
          <code>{snippet}</code>
        </Box>
      </Paper>
      <Box>
        <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
          {t('Works on')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {platforms.map((platform) => (
            <Chip key={platform} label={platform} variant="outlined" />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
