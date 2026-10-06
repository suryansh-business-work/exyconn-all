import { useMemo } from 'react';
import { FilterOp, type TableFilterInput } from '@exyconn/shell/graphql/generated';
import { useCurrentSite } from './site.context';

/**
 * Narrows a website-content list (blog, case studies, careers, navigation) to the current
 * site. The default site also owns records filed before sites existed (siteId '').
 */
export function useSiteScope() {
  const { site } = useCurrentSite();
  return useMemo(() => {
    const filters: TableFilterInput[] = [{ field: 'siteId', op: FilterOp.Equals, value: site.id }];
    const owns = (row: { siteId: string }) =>
      row.siteId === site.id || (site.isDefault && row.siteId === '');
    return { siteId: site.id, filters, owns };
  }, [site.id, site.isDefault]);
}
