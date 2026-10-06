import type { CmsComponentDef } from './types';
import {
  DETAIL_ARCHITECTURE_PROPS,
  DETAIL_CTA_PROPS,
  DETAIL_FAQ_PROPS,
  DETAIL_INTRO_PROPS,
  DETAIL_LIVE_PROPS,
  DETAIL_LOGOS_PROPS,
  DETAIL_OFFERINGS_PROPS,
  DETAIL_PROCESS_PROPS,
  DETAIL_PROOF_PROPS,
  DETAIL_RELATED_PROPS,
  DETAIL_STAGE_PROPS,
  DETAIL_TABS_PROPS,
} from './detail.copy';

/**
 * The sections of the capability and service detail pages (/ai/*, /services/*), also used by
 * the hubs and the AI service pages: the stage, the chapters and the closing band.
 */
export const DETAIL_COMPONENTS = [
  {
    key: 'detail.stage',
    label: 'Page stage',
    category: 'Detail pages',
    description:
      'The night stage at the top: breadcrumb, title, lede, two buttons and the 3D scene (shapes and their data; "glyph" names the mark a glyph shape draws). An optional tagline sits under the buttons.',
    defaultProps: DETAIL_STAGE_PROPS,
  },
  {
    key: 'detail.proof',
    label: 'Stat strip',
    category: 'Detail pages',
    description:
      'Counters under the stage. A value may name {serviceCount} or {categoryCount}, counted from the AI service catalogue.',
    defaultProps: DETAIL_PROOF_PROPS,
  },
  {
    key: 'detail.logos',
    label: 'Tools strip',
    category: 'Detail pages',
    description: 'A row of tool logos under the stage (each with its intrinsic width and height).',
    defaultProps: DETAIL_LOGOS_PROPS,
  },
  {
    key: 'detail.intro',
    label: 'What it is',
    category: 'Detail pages',
    description:
      'The definition and the reasons to invest; with a demo (a chat or an agent trace) the reasons sit under the definition.',
    defaultProps: DETAIL_INTRO_PROPS,
  },
  {
    key: 'detail.live',
    label: 'Live demo chapter',
    category: 'Detail pages',
    description: 'A numbered heading over whatever is dropped inside it, e.g. the WhatsApp demo.',
    defaultProps: DETAIL_LIVE_PROPS,
    acceptsChildren: true,
  },
  {
    key: 'detail.architecture',
    label: 'Architecture',
    category: 'Detail pages',
    description: 'A heading beside a layered diagram (each layer a label and its nodes).',
    defaultProps: DETAIL_ARCHITECTURE_PROPS,
  },
  {
    key: 'detail.offerings',
    label: 'Offerings',
    category: 'Detail pages',
    description: 'Use cases or deliverables as icon cards; a hovered card lights the stage scene.',
    defaultProps: DETAIL_OFFERINGS_PROPS,
  },
  {
    key: 'detail.tabs',
    label: 'Tabs',
    category: 'Detail pages',
    description:
      'Server-rendered tabs with a pager. A point "Term: text" shows the term in bold; a logo with an empty src shows none.',
    defaultProps: DETAIL_TABS_PROPS,
  },
  {
    key: 'detail.process',
    label: 'How we work',
    category: 'Detail pages',
    description: 'The delivery process as stations on a line.',
    defaultProps: DETAIL_PROCESS_PROPS,
  },
  {
    key: 'detail.faq',
    label: 'FAQ',
    category: 'Detail pages',
    description: 'A heading beside the questions (with FAQPage structured data).',
    defaultProps: DETAIL_FAQ_PROPS,
  },
  {
    key: 'detail.related',
    label: 'Related pages',
    category: 'Detail pages',
    description: 'Link cards to other pages of the same section.',
    defaultProps: DETAIL_RELATED_PROPS,
  },
  {
    key: 'detail.cta',
    label: 'Closing call to action',
    category: 'Detail pages',
    description:
      'The closing night band: label, title, text and two buttons; "echoShape" picks which stage shape re-forms in it (service pages: 1, their glyph).',
    defaultProps: DETAIL_CTA_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
