import { compact, schemaNode, type NamedLink } from './compact';
import type { JsonLdNode } from '../types';

export interface PublisherInput extends NamedLink {
  readonly logo?: string;
}

export interface ArticleInput {
  readonly headline: string;
  readonly url: string;
  readonly description?: string;
  readonly image?: string;
  /** ISO 8601. */
  readonly datePublished?: string;
  /** ISO 8601. */
  readonly dateModified?: string;
  readonly authorName?: string;
  readonly publisher?: PublisherInput;
  /** Article (default), BlogPosting or NewsArticle. */
  readonly type?: 'Article' | 'BlogPosting' | 'NewsArticle';
}

function publisherNode(publisher: PublisherInput): JsonLdNode {
  const { logo } = publisher;
  return compact({
    '@type': 'Organization',
    name: publisher.name,
    url: publisher.url,
    logo: logo ? { '@type': 'ImageObject', url: logo } : undefined,
  });
}

/** schema.org Article / BlogPosting / NewsArticle. */
export function articleLd(input: ArticleInput): JsonLdNode {
  const { authorName, publisher } = input;
  return schemaNode(input.type ?? 'Article', {
    headline: input.headline,
    description: input.description,
    image: input.image,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    publisher: publisher && publisherNode(publisher),
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
  });
}
