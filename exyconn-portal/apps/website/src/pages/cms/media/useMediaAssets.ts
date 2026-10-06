import { useState } from 'react';
import { useCmsAssetsQuery } from '@exyconn/shell/graphql/generated';

export const MEDIA_PAGE_SIZE = 24;

/** One page of a site's media, searched by name or alt text. */
export function useMediaAssets(siteId: string) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const query = useCmsAssetsQuery({
    variables: { siteId, page, pageSize: MEDIA_PAGE_SIZE, search: search.trim() || null },
    fetchPolicy: 'cache-and-network',
  });
  const rows = query.data?.cmsAssets.rows ?? [];
  const totalCount = query.data?.cmsAssets.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / MEDIA_PAGE_SIZE));

  return {
    ...query,
    rows,
    totalCount,
    page,
    pageCount,
    setPage,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
  };
}

export type MediaAsset = ReturnType<typeof useMediaAssets>['rows'][number];
