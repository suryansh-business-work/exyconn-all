/** Escapes a user's typing so it cannot act as a regular expression. */
export function escapeForRegex(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * The shortest query worth running.
 *
 * Two characters would match a fair share of every collection in the database and cost a
 * scan per provider to find that out.
 */
export const MIN_QUERY_LENGTH = 2;

/** The longest query taken seriously; beyond this somebody is pasting, not searching. */
export const MAX_QUERY_LENGTH = 80;

/**
 * A case-insensitive "contains" match across several fields.
 *
 * Unanchored on purpose — people search for the middle of a name or a number — and that
 * means it cannot use an index, so every caller of this is bounded by a small limit.
 */
export function containsAny(fields: readonly string[], query: string) {
  const pattern = { $regex: escapeForRegex(query), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: pattern })) };
}
