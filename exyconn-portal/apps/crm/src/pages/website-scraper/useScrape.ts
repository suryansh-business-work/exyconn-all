import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useScrapeWebsiteMutation } from '@exyconn/shell/graphql/generated';

/** "Scrape": reads one page through Firecrawl and hands back the new scrape's id. */
export function useScrape(onScraped: (id: string) => void) {
  const t = useT();
  const [scrapeWebsite, { loading }] = useScrapeWebsiteMutation();
  const [error, setError] = useState<string | null>(null);

  const run = async (url: string) => {
    setError(null);
    try {
      const { data } = await scrapeWebsite({ variables: { url } });
      if (data) {
        onScraped(data.scrapeWebsite.id);
      }
    } catch (error_) {
      portalLogger.warn('crm: scraping a website failed', error_);
      setError(errorMessage(error_, t('Could not scrape the page.')));
    }
  };

  return { run, scraping: loading, error };
}
