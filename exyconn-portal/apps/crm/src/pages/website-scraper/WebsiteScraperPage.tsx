import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Stack } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useFirecrawlReadyQuery } from '@exyconn/shell/graphql/generated';
import { ScrapeUrlForm } from './forms/scrape-url';
import { FirecrawlNotConfigured } from './FirecrawlNotConfigured';
import { ScrapeDetailDialog } from './ScrapeDetailDialog';
import { ScrapesGrid } from './ScrapesGrid';
import { useScrape } from './useScrape';
import { WebsiteScraperSkeleton } from './WebsiteScraperSkeleton';

const logFailure = (what: string) => (error: unknown) => portalLogger.warn(`crm: ${what}`, error);

/** Scrape a page, browse what was scraped, open one to read it or send it to the AI. */
function ScraperWorkspace() {
  const [params] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const refresh = () => setRefreshSignal((n) => n + 1);
  const scrape = useScrape((id) => {
    refresh();
    setOpenId(id);
  });
  const close = () => {
    setOpenId(null);
    // The list's "Sent to AI" column may have changed while the page was open.
    refresh();
  };

  return (
    <Stack spacing={2}>
      <Box sx={readingPanel}>
        <ScrapeUrlForm
          initialUrl={params.get('url') ?? ''}
          scraping={scrape.scraping}
          onScrape={(url) => {
            scrape.run(url).catch(logFailure('scraping a website'));
          }}
        />
      </Box>
      {scrape.error && <Alert severity="error">{scrape.error}</Alert>}
      <ScrapesGrid refreshSignal={refreshSignal} onOpen={(row) => setOpenId(row.id)} />
      <ScrapeDetailDialog scrapeId={openId} onClose={close} onDeleted={close} />
    </Stack>
  );
}

/**
 * CRM > Tools > Website scraper: read a public web page through Firecrawl, keep its text, and
 * hand it to the AI with an instruction once the person has seen what that will cost.
 */
export function WebsiteScraperPage() {
  const t = useT();
  const { data, loading, error, refetch } = useFirecrawlReadyQuery({
    fetchPolicy: 'cache-and-network',
  });
  const ready = data?.firecrawlReady;
  const retry = () => {
    refetch().catch(logFailure('reloading whether Firecrawl is configured'));
  };

  let body;
  if (error && ready === undefined) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the website scraper.'))}
      </Alert>
    );
  } else if (loading && ready === undefined) {
    body = <WebsiteScraperSkeleton />;
  } else if (ready) {
    body = <ScraperWorkspace />;
  } else {
    body = <FirecrawlNotConfigured />;
  }

  return (
    <Box>
      <PageHeader
        title="Website scraper"
        subtitle="Read a website's page, keep its text, and ask the AI about it"
      />
      {body}
    </Box>
  );
}
