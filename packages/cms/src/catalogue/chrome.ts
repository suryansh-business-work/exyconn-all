import type { CmsComponentDef } from './types';

/** The site chrome: the header and footer every page wears, as dynamic components. */
export const CHROME_COMPONENTS = [
  {
    key: 'chrome.header',
    label: 'Site header',
    category: 'Chrome',
    description:
      'The site header: logo, navigation from Website › Navigation, search and theme switch.',
    defaultProps: {},
  },
  {
    key: 'chrome.footer',
    label: 'Site footer',
    category: 'Chrome',
    description: 'The site footer: navigation columns, social links and legal links.',
    defaultProps: {},
  },
] as const satisfies readonly CmsComponentDef[];
