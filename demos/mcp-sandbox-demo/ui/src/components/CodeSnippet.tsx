import { useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, Paper, Typography } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';

interface CodeSnippetProps {
  /** What the snippet is, shown above it and read by screen readers. */
  label: string;
  code: string;
}

/** A block of text to paste somewhere else, with a Copy button. */
export function CodeSnippet({ label, code }: Readonly<CodeSnippetProps>) {
  const t = useT();
  const notify = useNotify();
  const copy = async () => {
    if (await copyToClipboard(code)) {
      notify('Copied', 'success');
    } else {
      notify('Could not copy. Select the text and copy it instead.', 'error');
    }
  };
  return (
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
        <Typography variant="caption" sx={{ fontWeight: 'fontWeightBold' }}>
          {t(label)}
        </Typography>
        <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
          {t('Copy')}
        </Button>
      </Box>
      <Box
        component="pre"
        role="region"
        tabIndex={0}
        aria-label={t(label)}
        sx={{
          m: 0,
          p: 2,
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: 'body2.fontSize',
          bgcolor: 'action.hover',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        <code>{code}</code>
      </Box>
    </Paper>
  );
}
