import { listItems, schemaNode, type NamedLink } from './compact';
import type { JsonLdNode } from '../types';

/** schema.org BreadcrumbList, root first. */
export function breadcrumbLd(crumbs: readonly NamedLink[]): JsonLdNode {
  return schemaNode('BreadcrumbList', { itemListElement: listItems(crumbs, 'item') });
}
