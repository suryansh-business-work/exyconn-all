import type { CmsSeedDesignSystem } from '../types';
import { EXYCONN_EXTRA_CSS, EXYCONN_TOKENS } from './design-tokens';

/**
 * exyconn.com's design tokens as they were before the CMS, so the first render from the CMS is
 * identical (see design-tokens.ts).
 */
export const EXYCONN_DESIGN_SYSTEM: CmsSeedDesignSystem = {
  name: 'Exyconn design system',
  tokens: EXYCONN_TOKENS,
  extraCss: EXYCONN_EXTRA_CSS,
};
