import type { CmsComponentDef } from './types';
import {
  SERVICE_BENEFITS_PROPS,
  SERVICE_DEFINITION_PROPS,
  SERVICE_FAQ_PROPS,
  SERVICE_GROUPED_CARDS_PROPS,
  SERVICE_INFO_GRID_PROPS,
  SERVICE_RELATED_HUBS_PROPS,
  SERVICE_STEPS_PROPS,
  SERVICE_WHATSAPP_DEMO_PROPS,
} from './service.copy';

/** The services hub's and service pages' own chapters (/services, /services/*). */
export const SERVICE_COMPONENTS = [
  {
    key: 'service.grouped-cards',
    label: 'Grouped link cards',
    category: 'Services',
    description:
      'A numbered chapter of card groups (the service pillars, the AI capability map). With "highlight", a hovered group lights its stage cluster.',
    defaultProps: SERVICE_GROUPED_CARDS_PROPS,
  },
  {
    key: 'service.steps',
    label: 'Process steps',
    category: 'Services',
    description:
      'A numbered chapter with steps on a line. With "highlight", each step lights its station in the stage scene.',
    defaultProps: SERVICE_STEPS_PROPS,
  },
  {
    key: 'service.info-grid',
    label: 'Info cards',
    category: 'Services',
    description:
      'A numbered chapter of plain cards with optional bullet points; "anchor" gives the section an id to link to, "indexPrefix" a mono index on each card.',
    defaultProps: SERVICE_INFO_GRID_PROPS,
  },
  {
    key: 'service.benefits',
    label: 'Benefits and assurances',
    category: 'Services',
    description: 'A numbered chapter of benefit cards with a strip of assurances under them.',
    defaultProps: SERVICE_BENEFITS_PROPS,
  },
  {
    key: 'service.definition',
    label: 'Definition',
    category: 'Services',
    description: 'A numbered heading beside one paragraph.',
    defaultProps: SERVICE_DEFINITION_PROPS,
  },
  {
    key: 'service.faq',
    label: 'FAQ (one column)',
    category: 'Services',
    description: 'A numbered chapter of questions (with FAQPage structured data).',
    defaultProps: SERVICE_FAQ_PROPS,
  },
  {
    key: 'service.related-hubs',
    label: 'Related hubs',
    category: 'Services',
    description:
      'Link cards to the other hubs, optionally under one featured card (an empty featured href shows none).',
    defaultProps: SERVICE_RELATED_HUBS_PROPS,
  },
  {
    key: 'service.whatsapp-demo',
    label: 'WhatsApp live demo',
    category: 'Services',
    description:
      'The self-playing WhatsApp conversation beside the form that opens the real demo bots. Drop it inside a live demo chapter.',
    defaultProps: SERVICE_WHATSAPP_DEMO_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
