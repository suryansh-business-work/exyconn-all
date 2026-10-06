import { useEffect, useState } from 'react';
import { useCmsGoogleFontsQuery } from '@exyconn/shell/graphql/generated';

const PAGE = 30;
const DEBOUNCE_MS = 300;

/** The Google Fonts catalogue, searched (debounced) and filtered, growing a page at a time. */
export function useGoogleFontCatalogue(open: boolean) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setQuery(search.trim());
      setLimit(PAGE);
    }, DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [search]);

  const result = useCmsGoogleFontsQuery({
    variables: { search: query || null, category: category || null, limit },
    skip: !open,
    fetchPolicy: 'cache-first',
  });
  const rows = result.data?.cmsGoogleFonts.rows ?? [];
  const totalCount = result.data?.cmsGoogleFonts.totalCount ?? 0;

  return {
    rows,
    totalCount,
    loading: result.loading,
    error: result.error,
    search,
    setSearch,
    category,
    setCategory: (value: string) => {
      setCategory(value);
      setLimit(PAGE);
    },
    hasMore: rows.length < totalCount,
    showMore: () => setLimit((value) => value + PAGE),
  };
}
