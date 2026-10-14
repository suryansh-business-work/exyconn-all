import { place } from './place';

/** The two GCC-in-India pages and the calculator's scenario presets (`?preset=`). */
export const GCC_GUIDE_PATH = '/gcc-in-india/cost-guide';
export const GCC_CALCULATOR_PATH = '/gcc-in-india/cost-calculator';
export const gccPresetHref = (preset: 'lean' | 'standard' | 'enterprise'): string =>
  `${GCC_CALCULATOR_PATH}?preset=${preset}`;

/** Sources the guide cites. Statutory points always add "confirm with a qualified adviser". */
export const GCC_SOURCES = {
  labourCodes:
    'https://www.littler.com/news-analysis/asap/indias-labor-law-overhaul-snapshot-key-changes',
  epf: 'https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/ContributionRate.pdf',
  claudePricing: 'https://platform.claude.com/docs/en/about-claude/pricing',
};

/** The globe's accent and the page family both GCC pages wear. */
export const GCC_FAMILY = 'services';
export const GCC_ACCENT = ['sky', 'cyan'];

interface Link {
  label: string;
  href: string;
}

const NO_LINK: Link = { label: '', href: '' };

export interface GuideCard {
  title: string;
  text: string;
  points?: string[];
  link?: Link;
}

/** A 'company.info-grid' of cards; every card carries every field, as the CMS editor expects. */
export function gccCards(items: readonly GuideCard[], columns: 2 | 3 | 4): string {
  return place('company.info-grid', {
    items: items.map((item) => ({
      title: item.title,
      text: item.text,
      points: item.points ?? [],
      link: item.link ?? NO_LINK,
    })),
    columns,
    indexPrefix: '',
  });
}

export interface GuideChapter {
  index: number;
  id: string;
  label: string;
  title: string;
  lede: string;
}

/** A numbered 'company.chapter' holding the given sections. */
export function gccChapter(heading: GuideChapter, sections: readonly string[]): string {
  return place('company.chapter', { ...heading }, sections.join(''));
}

/** A 'gcc.table': the first column heads each row. */
export function gccTable(
  caption: string,
  columns: string[],
  rows: string[][],
  note: string,
): string {
  return place('gcc.table', {
    caption,
    columns,
    rows: rows.map(([label, ...cells]) => ({ label, cells })),
    note,
  });
}
