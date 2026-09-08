import { useEffect } from 'react';
import { useI18n } from '@exyconn/i18n';

/**
 * Tells the document itself which language it is in and which way it runs.
 *
 * Not cosmetic: `dir` is what makes the browser mirror scrollbars, text selection, caret
 * movement and native form controls, and `lang` is what screen readers and hyphenation read.
 * Styling alone gets none of that.
 */
export function DirectionSync() {
  const { locale, direction } = useI18n();

  useEffect(() => {
    const root = globalThis.document?.documentElement;
    if (!root) {
      return;
    }
    root.setAttribute('dir', direction);
    root.setAttribute('lang', locale);
  }, [locale, direction]);

  return null;
}
