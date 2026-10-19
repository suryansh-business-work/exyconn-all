import { useT } from '@exyconn/i18n';
import { Alert, Link } from '@exyconn/shell/components/ui';
import { appUrl } from '@exyconn/shell/config/apps';

/** Where Tech configures Firecrawl. */
const TECH_FIRECRAWL_PATH = '/tech/environment-variables/firecrawl';

/** Tech has not configured Firecrawl yet, so nothing can be scraped. */
export function FirecrawlNotConfigured() {
  const t = useT();
  return (
    <Alert severity="info">
      {t(
        'The website scraper is not set up yet. Ask Tech to add a Firecrawl config (a hosted API key or a self-hosted URL) in',
      )}{' '}
      <Link href={appUrl('tech', TECH_FIRECRAWL_PATH)}>
        {t('Tech > Environment Variables > Firecrawl')}
      </Link>
      .
    </Alert>
  );
}
