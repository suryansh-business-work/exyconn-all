import { readPass, signPass } from '../../lib/scopedPass';

/** Long enough to look a draft over and share it with a colleague; short enough to expire. */
const PREVIEW_LIFETIME = '2h';

/** A link token that shows one page's draft on the website (noindex, see /cms-preview). */
export const signPreviewToken = (pageId: string): string =>
  signPass('cms-preview', { sub: pageId, tv: 0 }, PREVIEW_LIFETIME);

/** The page a preview token names, or null when it is forged or expired. */
export function previewPageId(token: string): string | null {
  return readPass('cms-preview', token)?.sub ?? null;
}
