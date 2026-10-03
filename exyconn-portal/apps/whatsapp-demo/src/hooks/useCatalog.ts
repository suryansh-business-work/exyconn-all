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
import { businessSchema, graphSchema, type WorkflowDef } from '@exyconn/wa-flow';
import type { CatalogBundle } from '../runtime/types';

type Entry = WhatsappDemoCatalogQuery['whatsappDemoCatalog'][number];

function toBundle(entry: Entry): CatalogBundle | null {
  const business = businessSchema.safeParse(entry.demo.business);
  if (!business.success) {
    portalLogger.warn('wa-demo: demo profile did not parse', business.error, {
      demo: entry.demo.key,
    });
    return null;
  }
  const workflows: WorkflowDef[] = [];
  for (const w of entry.workflows) {
    const graph = graphSchema.safeParse(w.graph);
    if (graph.success) {
      workflows.push({
        key: w.key,
        name: w.name,
        description: w.description,
        keywords: w.keywords,
        order: w.order,
        graph: graph.data,
      });
    } else {
      portalLogger.warn('wa-demo: workflow graph did not parse', graph.error, { workflow: w.key });
    }
  }
  const { demo } = entry;
  return {
    revision: entry.revision,
    demo: {
      key: demo.key,
      industry: demo.industry,
      business: business.data,
      greeting: demo.greeting,
      menuText: demo.menuText,
      menuButton: demo.menuButton,
      order: demo.order,
      active: demo.active,
    },
    workflows,
  };
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
