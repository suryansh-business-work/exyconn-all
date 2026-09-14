import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';

/**
 * Translates the words a form field is made of: its label, its hint, and the message it
 * shows when what somebody typed is wrong.
 *
 * Those live in ~770 field declarations and in every Zod schema in the portal, all of them
 * English strings passed as props. Translating them where they arrive means a form reads in
 * the person's language without any of those files knowing that languages exist.
 *
 * Anything that is not a plain string — a hint built out of JSX — is passed through as it is.
 */
export function useFieldCopy(): (text: ReactNode) => ReactNode {
  const t = useT();
  return (text) => (typeof text === 'string' ? t(text) : text);
}
