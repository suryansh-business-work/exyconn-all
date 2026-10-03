import { organizationRef, schemaNode, type NamedLink } from './compact';
import type { JsonLdNode } from '../types';

export interface ServiceInput {
  readonly name: string;
  readonly description: string;
  readonly url?: string;
  readonly serviceType?: string;
  readonly areaServed?: string;
  readonly provider?: NamedLink;
}

/** schema.org Service — something the organization does for a customer. */
export function serviceLd(input: ServiceInput): JsonLdNode {
  const { provider } = input;
  return schemaNode('Service', {
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.serviceType,
    areaServed: input.areaServed,
    provider: provider && organizationRef(provider),
  });
}
