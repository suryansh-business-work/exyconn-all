import { useEffect, useMemo } from 'react';
import { Link as RouterLink, Outlet, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { SiteContext, type CurrentSite } from './site.context';
import { SiteSwitcher } from './SiteSwitcher';
import { rememberSite } from './site-paths';
import { useCmsSites } from './useCmsSites';

/**
 * Every /website/s/:siteSlug/… page renders inside this: it resolves the site from the URL,
 * remembers it for the sidebar's links, and shows the switcher above the page.
 */
export function SiteLayout() {
  const t = useT();
  const { siteSlug = '' } = useParams();
  const { sites, loading, error, refetch } = useCmsSites();
  const site = sites.find((candidate) => candidate.slug === siteSlug);

  useEffect(() => {
    if (site) rememberSite(site.slug);
  }, [site]);

  const value = useMemo<CurrentSite | null>(
    () => (site ? { site, sites, refetchSites: refetch } : null),
    [site, sites, refetch],
  );

  if (value) {
    return (
      <SiteContext.Provider value={value}>
        <Flex alignItems="center" gap={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <SiteSwitcher />
          <Text size="sm" color="text.secondary" sx={{ flexGrow: 1 }}>
            {value.site.domains.join(', ')}
          </Text>
        </Flex>
        <Outlet />
      </SiteContext.Provider>
    );
  }
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label={t('Loading the website')} />
      </Box>
    );
  }
  return (
    <Alert
      severity={error ? 'error' : 'warning'}
      action={
        <Button component={RouterLink} to="/website/sites" color="inherit" size="small">
          {t('Websites')}
        </Button>
      }
    >
      {error
        ? t('Could not load the websites: {reason}', { reason: error.message })
        : t('There is no website "{slug}".', { slug: siteSlug })}
    </Alert>
  );
}
