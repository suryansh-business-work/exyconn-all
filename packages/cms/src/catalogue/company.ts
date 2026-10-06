import type { CmsComponentDef } from './types';
import {
  COMPANY_BELIEFS_PROPS,
  COMPANY_CHAPTER_PROPS,
  COMPANY_CTA_PROPS,
  COMPANY_HORIZONS_PROPS,
  COMPANY_INFO_GRID_PROPS,
  COMPANY_LINK_CARDS_PROPS,
  COMPANY_LINK_ROWS_PROPS,
  COMPANY_MARKET_REACH_PROPS,
  COMPANY_RELATED_HUBS_PROPS,
  COMPANY_STAGE_PROPS,
  COMPANY_STATEMENT_PROPS,
  COMPANY_STATS_PROPS,
} from './company.copy';
import {
  COMPANY_CONTACT_PROPS,
  COMPANY_QUOTE_PROPS,
  COMPANY_SITEMAP_PROPS,
} from './company.copy-pages';
import { COMPANY_PLATFORM_HUB_PROPS } from './company.copy-platform';

/**
 * The company pages (about, vision, contact, quote, services hubs, sitemap): the inner-page
 * sections they are built from, and the page bodies that carry a form or derived counts.
 */
export const COMPANY_COMPONENTS = [
  {
    key: 'company.stage',
    label: 'Inner stage',
    category: 'Company',
    description:
      'The night stage at the top of an inner page: breadcrumb, title, lede, two buttons and the 3D scene. "globeFromMarkets" draws the globe from the markets the site is published for.',
    defaultProps: COMPANY_STAGE_PROPS,
  },
  {
    key: 'company.stats',
    label: 'Figures strip',
    category: 'Company',
    description: 'A row of figures that count up, under a stage.',
    defaultProps: COMPANY_STATS_PROPS,
  },
  {
    key: 'company.chapter',
    label: 'Chapter',
    category: 'Company',
    description:
      'A numbered chapter: kicker, title and lede, with the sections dropped inside it under the heading.',
    defaultProps: COMPANY_CHAPTER_PROPS,
    acceptsChildren: true,
  },
  {
    key: 'company.info-grid',
    label: 'Info cards',
    category: 'Company',
    description: 'Cards of a title and text, with optional points and a link; 2, 3 or 4 a row.',
    defaultProps: COMPANY_INFO_GRID_PROPS,
  },
  {
    key: 'company.link-cards',
    label: 'Link cards',
    category: 'Company',
    description: 'Cards that are each one link: a numbered list ("work") or three a row ("grid").',
    defaultProps: COMPANY_LINK_CARDS_PROPS,
  },
  {
    key: 'company.beliefs',
    label: 'Beliefs',
    category: 'Company',
    description: 'Numbered beliefs or principles: a big number, a title and a line of text.',
    defaultProps: COMPANY_BELIEFS_PROPS,
  },
  {
    key: 'company.market-reach',
    label: 'Market reach',
    category: 'Company',
    description:
      'How many markets, countries and languages the site is published for. The text may name {markets}, {countries} and {languages}.',
    defaultProps: COMPANY_MARKET_REACH_PROPS,
  },
  {
    key: 'company.statement',
    label: 'Statement',
    category: 'Company',
    description: 'Large statement paragraphs, then an optional list of points.',
    defaultProps: COMPANY_STATEMENT_PROPS,
  },
  {
    key: 'company.horizons',
    label: 'Horizons',
    category: 'Company',
    description: 'Goals as now → next → later steps beside the sunrise.',
    defaultProps: COMPANY_HORIZONS_PROPS,
  },
  {
    key: 'company.cta',
    label: 'Closing call to action',
    category: 'Company',
    description: 'The night band that closes an inner page: title, text and two buttons.',
    defaultProps: COMPANY_CTA_PROPS,
  },
  {
    key: 'company.related-hubs',
    label: 'Related hubs',
    category: 'Company',
    description: 'The other service hubs as link cards in a numbered chapter.',
    defaultProps: COMPANY_RELATED_HUBS_PROPS,
  },
  {
    key: 'company.link-rows',
    label: 'Grouped link rows',
    category: 'Company',
    description: 'Titled groups of linked services, one row each.',
    defaultProps: COMPANY_LINK_ROWS_PROPS,
  },
  {
    key: 'company.contact',
    label: 'Contact panel',
    category: 'Forms',
    description:
      "The contact form with its promises, the direct channels and quick links. Every label and message of the form is editable; the topics' values are what the portal files messages under.",
    defaultProps: COMPANY_CONTACT_PROPS,
  },
  {
    key: 'company.quote',
    label: 'Budget calculator',
    category: 'Forms',
    description:
      "The four-step project budget calculator, its live summary and what happens next. The options and rates are the calculator's own.",
    defaultProps: COMPANY_QUOTE_PROPS,
  },
  {
    key: 'company.platform-hub',
    label: 'Platform directory',
    category: 'Company',
    description:
      'The infrastructure platform: stage, figures and the filterable service directory, all counted from the services list.',
    defaultProps: COMPANY_PLATFORM_HUB_PROPS,
  },
  {
    key: 'company.sitemap',
    label: 'Sitemap',
    category: 'Company',
    description:
      'Every page grouped by section (Website › Navigation), with a search filter. The texts may name {pages}, {sections}, {count}, {shown} and {total}.',
    defaultProps: COMPANY_SITEMAP_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
