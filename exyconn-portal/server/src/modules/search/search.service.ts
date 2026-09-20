import { providersFor } from './search.registry';
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from './search.text';
import { logger } from '../../utils/logger';
import type { Role } from '../../constants/roles';
import type { SearchHit } from './search.registry';

/** One group of results, as the palette renders it. */
export interface SearchGroup {
  key: string;
  label: string;
  hits: SearchHit[];
}

/** How many rows one module may contribute. Enough to recognise, few enough to scan. */
const PER_PROVIDER = 5;

/**
 * Searches every module this caller may open, in parallel, and returns the groups that
 * matched.
 *
 * One provider failing is not the search failing: the box is a convenience, and a module
 * whose query blew up should cost its own group, not the answer.
 */
export async function searchEverything(query: string, roles: readonly Role[]) {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return [];
  }
  const results = await Promise.all(
    providersFor(roles).map(async (provider): Promise<SearchGroup | null> => {
      try {
        const hits = await provider.find(trimmed, PER_PROVIDER);
        return hits.length > 0 ? { key: provider.key, label: provider.label, hits } : null;
      } catch (error) {
        logger.error(error, `Search provider "${provider.key}" failed`);
        return null;
      }
    }),
  );
  return results.filter((group): group is SearchGroup => group !== null);
}
