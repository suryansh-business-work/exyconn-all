import { useT } from '@exyconn/i18n';
import { Alert, Link } from '@exyconn/shell/components/ui';
import { appUrl } from '@exyconn/shell/config/apps';

/** Where Tech saves the Firecrawl key. */
const TECH_FIRECRAWL_PATH = '/tech/environment-variables/firecrawl';

/** Tech has not saved a Firecrawl key yet, so nothing can be scraped. */
export function FirecrawlNotConfigured() {
  const t = useT();
  return (
    <Alert severity="info">
      {t('The website scraper is not set up yet. Ask Tech to add a Firecrawl key in')}{' '}
      <Link href={appUrl('tech', TECH_FIRECRAWL_PATH)}>
        {t('Tech > Environment Variables > Firecrawl')}
      </Link>
      .
    </Alert>
  );
}
