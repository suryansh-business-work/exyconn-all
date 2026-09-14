import type { Translate } from '@exyconn/tracker-core';
import { interpolate } from '@exyconn/i18n/src/translate';

/**
 * The translator these tests pass in: it fills placeholders and returns the English source,
 * which is exactly what the real one does for a language whose catalogue is still empty. That
 * keeps every assertion below written in the words the app ships with.
 */
export const t: Translate = (source, values) => interpolate(source, values);
