import { Navigate, useLocation } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress } from '@exyconn/shell/components/ui';
import { sitePath } from './site-paths';
import { useCmsSites } from './useCmsSites';

const WEBSITE_PREFIX = '/website';

/**
 * The site page a site-less address names: /website/blog → blog. An address already under a
 * site that no route answers (/website/s/x/unknown) goes to that site's overview instead of
 * being prefixed again, which would redirect forever.
 */
function sectionOf(pathname: string): string {
  const rest = pathname.slice(WEBSITE_PREFIX.length).replace(/^\/+/, '');
  return rest === 's' || rest.startsWith('s/') ? '' : rest;
}

/**
 * Sends a page address without a site (/website, a sidebar link, an old bookmark such as
 * /website/blog) to the same page of the site last worked on, or of the default site.
 */
export function SiteRedirect() {
  const t = useT();
  const { pathname, search } = useLocation();
  const { preferred, loading, error } = useCmsSites();

  if (preferred) {
    return <Navigate to={`${sitePath(preferred.slug, sectionOf(pathname))}${search}`} replace />;
  }
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label={t('Loading the websites')} />
      </Box>
    );
  }
  return (
    <Alert severity={error ? 'error' : 'info'}>
      {error
        ? t('Could not load the websites: {reason}', { reason: error.message })
        : t('There is no website yet. Add one under Websites.')}
    </Alert>
  );
}
