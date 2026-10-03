import { schemaNode } from './compact';
import type { JsonLdNode } from '../types';

/** The placeholder a SearchAction target must contain. */
export const SEARCH_TERM_PLACEHOLDER = '{search_term_string}';

export interface WebSiteInput {
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  /** e.g. "https://tools.exyconn.com/tools?q={search_term_string}" — adds a sitelinks search box. */
  readonly searchUrlTemplate?: string;
}

/** schema.org WebSite, with a SearchAction when the site has a search URL. */
export function webSiteLd(input: WebSiteInput): JsonLdNode {
  const { searchUrlTemplate } = input;
  return schemaNode('WebSite', {
    name: input.name,
    url: input.url,
    description: input.description,
    potentialAction: searchUrlTemplate
      ? {
          '@type': 'SearchAction',
          target: searchUrlTemplate,
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  });
}
