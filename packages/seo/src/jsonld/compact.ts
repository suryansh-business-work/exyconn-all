import { SCHEMA_CONTEXT } from '../constants';
import type { JsonLdNode } from '../types';

/** Drops undefined values and empty lists, so an optional field never prints as `null`/`[]`. */
export function compact(node: Record<string, unknown>): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0),
    ),
  );
}

/** A top-level node: `@context` first, then `@type`, then the fields in the given order. */
export function schemaNode(type: string, fields: Record<string, unknown>): JsonLdNode {
  return compact({ '@context': SCHEMA_CONTEXT, '@type': type, ...fields });
}

/** A named link to another thing, e.g. a breadcrumb crumb or a list entry. */
export interface NamedLink {
  readonly name: string;
  readonly url: string;
}

/** A reference to an organization nested inside another node (provider, publisher). */
export function organizationRef(org: NamedLink): JsonLdNode {
  return { '@type': 'Organization', name: org.name, url: org.url };
}

/** Numbered ListItems, the shape BreadcrumbList and ItemList share. */
export function listItems(items: readonly NamedLink[], urlKey: 'item' | 'url'): JsonLdNode[] {
  return items.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.name,
    [urlKey]: entry.url,
  }));
}
