import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, Stack, Typography } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import type { WebScrapeFieldsFragment } from '@exyconn/shell/graphql/generated';

/** The scraped page as Firecrawl returned it, read-only, with a Copy button. */
export function ScrapeText({ scrape }: Readonly<{ scrape: WebScrapeFieldsFragment }>) {
  const t = useT();
  const notify = useNotify();
  const { formatNumber } = useFormatters();
  const cut = scrape.charCount > scrape.markdown.length;

  const copy = async () => {
    const copied = await copyToClipboard(scrape.markdown);
    notify(
      copied ? t('Page text copied') : t('Could not copy: your browser blocked the clipboard'),
      copied ? 'success' : 'error',
    );
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          {t('Page text')}
        </Typography>
        <Button
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={() => {
            copy().catch(() => notify(t('Could not copy the page text'), 'error'));
          }}
        >
          {t('Copy')}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {t('{count} characters', { count: formatNumber(scrape.charCount) })}
        {cut &&
          ` · ${t('Only the first {kept} were kept.', { kept: formatNumber(scrape.markdown.length) })}`}
      </Typography>
      <Box
        role="region"
        tabIndex={0}
        aria-label={t('Page text')}
        sx={{
          m: 0,
          p: 1.5,
          maxHeight: 360,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          typography: 'body2',
          fontFamily: 'monospace',
          bgcolor: 'action.hover',
          borderRadius: 1,
        }}
      >
        {scrape.markdown}
      </Box>
    </Stack>
  );
}
