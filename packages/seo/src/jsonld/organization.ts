import { compact, schemaNode } from './compact';
import type { JsonLdNode } from '../types';

export interface ContactPointInput {
  readonly contactType: string;
  readonly url?: string;
  readonly email?: string;
  readonly availableLanguage?: readonly string[];
}

export interface OrganizationInput {
  readonly name: string;
  readonly url: string;
  readonly logo?: string;
  readonly description?: string;
  readonly knowsAbout?: readonly string[];
  readonly sameAs?: readonly string[];
  readonly contactPoint?: ContactPointInput;
}

/** schema.org Organization — who publishes the site. */
export function organizationLd(input: OrganizationInput): JsonLdNode {
  const { contactPoint } = input;
  return schemaNode('Organization', {
    name: input.name,
    url: input.url,
    logo: input.logo,
    description: input.description,
    knowsAbout: input.knowsAbout,
    sameAs: input.sameAs,
    contactPoint: contactPoint && compact({ '@type': 'ContactPoint', ...contactPoint }),
  });
}
