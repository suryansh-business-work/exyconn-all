import { useEffect, useRef, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from './serverGridQuery';

/**
 * The grid's search box: its live text, and the trimmed search the grid last loaded with
 * (`searchRef`, read by the datasource). Typing debounces, then reloads from the first row —
 * but only when the text the grid would search for actually changed, so mounting or re-typing
 * the same value is free.
 */
export function useGridSearch(initialSearch: string, reload: () => void) {
  const searchRef = useRef(initialSearch.trim());
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const next = search.trim();
    if (next === searchRef.current) {
      return undefined;
    }
    const id = setTimeout(() => {
      searchRef.current = next;
      reload();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search, reload]);

  return { search, setSearch, searchRef };
}
