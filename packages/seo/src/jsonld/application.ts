import { organizationRef, schemaNode, type NamedLink } from './compact';
import type { JsonLdNode } from '../types';

export interface OfferInput {
  readonly price: string;
  readonly priceCurrency: string;
}

export interface ApplicationInput {
  readonly name: string;
  readonly url: string;
  readonly description: string;
  /** schema.org applicationCategory, e.g. "UtilitiesApplication", "BusinessApplication". */
  readonly applicationCategory: string;
  /** Defaults to "All" — a browser app runs anywhere. */
  readonly operatingSystem?: string;
  /** WebApplication (the default) for browser apps, SoftwareApplication for installables. */
  readonly type?: 'WebApplication' | 'SoftwareApplication';
  readonly image?: string;
  readonly offer?: OfferInput;
  readonly provider?: NamedLink;
}

/** schema.org WebApplication / SoftwareApplication. */
export function applicationLd(input: ApplicationInput): JsonLdNode {
  const { offer, provider } = input;
  return schemaNode(input.type ?? 'WebApplication', {
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    applicationCategory: input.applicationCategory,
    operatingSystem: input.operatingSystem ?? 'All',
    offers: offer && { '@type': 'Offer', price: offer.price, priceCurrency: offer.priceCurrency },
    provider: provider && organizationRef(provider),
  });
}
