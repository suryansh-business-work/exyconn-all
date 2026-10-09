/** Maps a Mongoose document/lean object's `_id` onto a GraphQL-friendly `id`. */
export function withId<T extends { _id?: unknown; id?: unknown }>(doc: T): T & { id: string } {
  const raw = (doc._id ?? doc.id) as { toString(): string };
  return { ...doc, id: raw.toString() };
}

/**
 * A value as text: strings as they are, ids and dates by their own `toString()`, anything
 * else (numbers, booleans) by `String`. Never the `[object Object]` that `String` gives a bare
 * object, because the objects that reach here are ids.
 */
export function stringOf(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    return (value as { toString(): string }).toString();
  }
  return String(value);
}

/** Applies {@link withId} across a list. */
export function withIds<T extends { _id?: unknown; id?: unknown }>(
  docs: T[],
): Array<T & { id: string }> {
  return docs.map(withId);
}
