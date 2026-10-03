import { listItems, schemaNode, type NamedLink } from './compact';
import type { JsonLdNode } from '../types';

export interface CollectionPageInput {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  /** The entries the page lists, in page order; printed as an ItemList. */
  readonly items?: readonly NamedLink[];
}

/** schema.org CollectionPage — a page whose content is a list of other pages. */
export function collectionPageLd(input: CollectionPageInput): JsonLdNode {
  const { items } = input;
  return schemaNode('CollectionPage', {
    name: input.name,
    description: input.description,
    url: input.url,
    mainEntity: items && {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: listItems(items, 'url'),
    },
  });
}
