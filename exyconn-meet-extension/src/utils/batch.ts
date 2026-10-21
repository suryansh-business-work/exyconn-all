/** Splits a list into consecutive slices of at most `size` items. */
export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const slices: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    slices.push(items.slice(start, start + size));
  }
  return slices;
}
