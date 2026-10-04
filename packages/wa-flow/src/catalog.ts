/**
 * A published catalogue entry — the demo and its workflows exactly as the API stores them —
 * parsed into the bundle a chat runs. Shared by the browser chat and the server's real
 * WhatsApp channel, so both refuse the same malformed content the same way.
 */
import { businessSchema, graphSchema, type WorkflowDef } from './schema';
import type { DemoBundle } from './engine/types';

export interface CatalogEntry {
  demo: {
    key: string;
    industry: string;
    business: unknown;
    greeting: string;
    menuText: string;
    menuButton: string;
    order: number;
    active: boolean;
  };
  workflows: readonly {
    key: string;
    name: string;
    description: string;
    keywords: readonly string[];
    order: number;
    graph: unknown;
  }[];
}

/** Told about each part that did not parse; the part is left out. */
export type CatalogWarn = (message: string, error: unknown, meta: Record<string, string>) => void;

/** The bundle, without any workflow whose graph does not parse; null when the demo itself does not. */
export function toDemoBundle(entry: CatalogEntry, warn: CatalogWarn): DemoBundle | null {
  const business = businessSchema.safeParse(entry.demo.business);
  if (!business.success) {
    warn('wa-demo: demo profile did not parse', business.error, { demo: entry.demo.key });
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
        keywords: [...w.keywords],
        order: w.order,
        graph: graph.data,
      });
    } else {
      warn('wa-demo: workflow graph did not parse', graph.error, { workflow: w.key });
    }
  }
  return { demo: { ...entry.demo, business: business.data }, workflows };
}
