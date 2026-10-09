export interface Keyed<T> {
  key: string;
  item: T;
}

/**
 * Pairs each item with a stable React key built from its content plus the
 * occurrence count of that content, so duplicate items still get unique keys.
 */
export function withUniqueKeys<T>(items: readonly T[], contentOf: (item: T) => string): Keyed<T>[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const content = contentOf(item);
    const occurrence = (seen.get(content) ?? 0) + 1;
    seen.set(content, occurrence);
    return { key: `${content}#${occurrence}`, item };
  });
}
