const SLUG_CHARS = new Set('abcdefghijklmnopqrstuvwxyz0123456789-');

/** What a link part may be, in words the editor can act on. */
export const SLUG_RULE = 'Use 3–60 lower-case letters, digits and dashes';

/** A link part: 3-60 lower-case letters, digits and dashes, not starting with a dash. */
export const isSlug = (slug: string) =>
  slug.length >= 3 &&
  slug.length <= 60 &&
  [...slug].every((c) => SLUG_CHARS.has(c)) &&
  !slug.startsWith('-');
