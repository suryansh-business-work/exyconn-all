import { interpolate } from '@exyconn/i18n/src/translate';
import type { Translate } from '../../src/translate';

/**
 * The REAL translator, with an empty catalogue — which is what `@exyconn/i18n` itself falls
 * back to for a string nothing has translated yet. The assertions below therefore still read
 * the exact English these helpers ship, placeholders and all, rather than a test double's.
 */
export const t: Translate = (source, values) => interpolate(source, values);
