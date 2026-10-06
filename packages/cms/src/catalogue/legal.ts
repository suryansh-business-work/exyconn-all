import type { CmsComponentDef } from './types';
import { LEGAL_DOCUMENT_PROPS, LEGAL_FAQ_PROPS, LEGAL_SECTION_PROPS } from './legal.copy';

/** The legal pages: a whole document, and the sections a document renders itself. */
export const LEGAL_COMPONENTS = [
  {
    key: 'legal.document',
    label: 'Legal document',
    category: 'Legal',
    description:
      'A legal page: band, last updated date, plain-words summary, contents and the sections. A section with an empty body is listed in the contents and rendered by a "Legal section" dropped inside.',
    defaultProps: LEGAL_DOCUMENT_PROPS,
    acceptsChildren: true,
  },
  {
    key: 'legal.section',
    label: 'Legal section',
    category: 'Legal',
    description:
      'A numbered legal section whose content is the block dropped inside it (a FAQ, a form).',
    defaultProps: LEGAL_SECTION_PROPS,
    acceptsChildren: true,
  },
  {
    key: 'legal.faq',
    label: 'Questions and answers',
    category: 'Legal',
    description: 'Questions and answers as an accordion, published as FAQ structured data too.',
    defaultProps: LEGAL_FAQ_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
