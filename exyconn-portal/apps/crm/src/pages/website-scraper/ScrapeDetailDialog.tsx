import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useGetWebScrapeQuery,
  type WebScrapeFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { AiAnalysisPanel } from './AiAnalysisPanel';
import { ScrapeText } from './ScrapeText';
import { useDeleteScrape } from './useDeleteScrape';

interface ScrapeDetailDialogProps {
  /** The scraped page to show; null keeps the dialog closed. */
  scrapeId: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

/** The scrape itself: where it came from, its text, and the AI step. */
function ScrapeBody({ scrape }: Readonly<{ scrape: WebScrapeFieldsFragment }>) {
  return (
    <Stack spacing={2}>
      <Link
        href={scrape.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, overflowWrap: 'anywhere' }}
      >
        {scrape.url}
        <OpenInNewIcon fontSize="inherit" />
      </Link>
      <ScrapeText scrape={scrape} />
      <Divider />
      <AiAnalysisPanel scrape={scrape} />
    </Stack>
  );
}

/** One scraped page, opened from the list or straight after scraping it. */
export function ScrapeDetailDialog({
  scrapeId,
  onClose,
  onDeleted,
}: Readonly<ScrapeDetailDialogProps>) {
  const t = useT();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, loading, error, refetch } = useGetWebScrapeQuery({
    variables: { id: scrapeId ?? '' },
    skip: !scrapeId,
  });
  const scrape = data?.getWebScrape;
  const remove = useDeleteScrape(onDeleted);
  const retry = () => {
    refetch().catch((failure: unknown) =>
      portalLogger.warn('crm: reloading a scraped page failed', failure),
    );
  };

  let body;
  if (scrape) {
    body = <ScrapeBody key={scrape.id} scrape={scrape} />;
  } else if (error) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the scraped page.'))}
      </Alert>
    );
  } else if (loading) {
    body = <FormSkeleton fields={3} surface={false} label="Loading the scraped page" />;
  }

  return (
    <Dialog open={Boolean(scrapeId)} onClose={onClose} fullWidth maxWidth="md" fullScreen={phone}>
      <DialogTitle sx={{ overflowWrap: 'anywhere' }}>
        {scrape?.title || t('Scraped page')}
      </DialogTitle>
      <DialogContent dividers>{body}</DialogContent>
      <DialogActions>
        {scrape && (
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            disabled={remove.deleting}
            onClick={() => {
              remove
                .run(scrape)
                .catch((failure: unknown) =>
                  portalLogger.warn('crm: deleting a scraped page failed', failure),
                );
            }}
            sx={{ mr: 'auto' }}
          >
            {t('Delete')}
          </Button>
        )}
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
