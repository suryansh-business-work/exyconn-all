/**
 * The published demos, straight from the server — the single source of truth the admin's
 * workflow editor publishes to. Re-read whenever the tab comes back into view, so a workflow
 * published meanwhile is what the next chat (or the next restart of one) runs.
 */
import { useEffect, useMemo } from 'react';
import {
  useWhatsappDemoCatalogQuery,
  type WhatsappDemoCatalogQuery,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { toDemoBundle, type CatalogWarn } from '@exyconn/wa-flow';
import type { CatalogBundle } from '../runtime/types';

type Entry = WhatsappDemoCatalogQuery['whatsappDemoCatalog'][number];

const warn: CatalogWarn = (message, error, meta) => portalLogger.warn(message, error, meta);

function toBundle(entry: Entry): CatalogBundle | null {
  const bundle = toDemoBundle(entry, warn);
  return bundle ? { ...bundle, revision: entry.revision } : null;
}

export function useCatalog() {
  const { data, loading, error, refetch } = useWhatsappDemoCatalogQuery({
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState === 'visible') {
        refetch().catch((e: unknown) => portalLogger.warn('wa-demo: catalog refresh failed', e));
      }
    };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [refetch]);

  const bundles = useMemo(() => {
    const map = new Map<string, CatalogBundle>();
    for (const entry of data?.whatsappDemoCatalog ?? []) {
      const bundle = toBundle(entry);
      if (bundle) {
        map.set(bundle.demo.key, bundle);
      }
    }
    return map;
  }, [data]);

  return { bundles, loading: loading && !data, error, refetch };
}
