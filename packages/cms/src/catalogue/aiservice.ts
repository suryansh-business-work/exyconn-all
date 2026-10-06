import type { CmsComponentDef } from './types';
import {
  AISERVICE_APPROACH_PROPS,
  AISERVICE_CATALOGUE_PROPS,
  AISERVICE_OUTCOMES_PROPS,
  AISERVICE_RELATED_PROPS,
} from './aiservice.copy';

/**
 * The AI service catalogue (/ai-services) and the AI service pages (/ai-services/<slug>). The
 * catalogue block on /ai-services is the list of services the whole site reads (home page,
 * sitemaps, {serviceCount}); a new service is a card there plus a page duplicated from another
 * service's.
 */
export const AISERVICE_COMPONENTS = [
  {
    key: 'aiservice.catalogue',
    label: 'AI service catalogue',
    category: 'AI services',
    description:
      'Every category and its service cards, filterable by category and search. The site lists its AI services from this block on /ai-services.',
    defaultProps: AISERVICE_CATALOGUE_PROPS,
  },
  {
    key: 'aiservice.approach',
    label: 'Service approach',
    category: 'AI services',
    description:
      "An AI service's description beside a panel to scope the work, with its category's link.",
    defaultProps: AISERVICE_APPROACH_PROPS,
  },
  {
    key: 'aiservice.outcomes',
    label: 'Service deliverables',
    category: 'AI services',
    description: 'Numbered outcome cards.',
    defaultProps: AISERVICE_OUTCOMES_PROPS,
  },
  {
    key: 'aiservice.related',
    label: 'More in the category',
    category: 'AI services',
    description: 'Link cards to other services of the same category.',
    defaultProps: AISERVICE_RELATED_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
