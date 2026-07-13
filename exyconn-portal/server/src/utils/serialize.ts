/** Maps a Mongoose document/lean object's `_id` onto a GraphQL-friendly `id`. */
export function withId<T extends { _id?: unknown; id?: unknown }>(doc: T): T & { id: string } {
  const raw = (doc._id ?? doc.id) as { toString(): string };
  return { ...doc, id: raw.toString() };
}

/** Applies {@link withId} across a list. */
export function withIds<T extends { _id?: unknown; id?: unknown }>(
  docs: T[],
): Array<T & { id: string }> {
  return docs.map(withId);
}
