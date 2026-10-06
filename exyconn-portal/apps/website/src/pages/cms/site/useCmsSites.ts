import { useCmsSitesQuery } from '@exyconn/shell/graphql/generated';
import { readLastSite } from './site-paths';
import type { CmsSite } from './site.context';

/** The websites, and the one a path without a site should open: the last used, else the default. */
export function useCmsSites() {
  const query = useCmsSitesQuery({ fetchPolicy: 'cache-and-network' });
  const sites: readonly CmsSite[] = query.data?.cmsSites ?? [];
  const last = readLastSite();
  const preferred =
    sites.find((site) => site.slug === last) ?? sites.find((site) => site.isDefault) ?? sites[0];
  return { ...query, sites, preferred };
}
