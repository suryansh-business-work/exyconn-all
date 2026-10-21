/**
 * Runs `task` over every item with at most `limit` in flight, keeping the input order in the
 * result. `task` must not reject — each caller turns its own failures into a value.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  // Each worker takes the next free item, and only once its task has settled takes another.
  const worker = async (): Promise<void> => {
    if (next >= items.length) {
      return;
    }
    const index = next;
    next += 1;
    results[index] = await task(items[index]);
    await worker();
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
