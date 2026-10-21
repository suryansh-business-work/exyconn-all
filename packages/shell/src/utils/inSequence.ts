/**
 * Runs `step` on each item in turn, each one waiting for the one before, and resolves to the
 * results in order. For work whose order matters or that must not overlap: uploads, the chunks
 * of an import, drawing onto one document. The first step that rejects stops the run and the
 * returned promise rejects with its error; the steps before it have already run.
 */
export function inSequence<Item, Result>(
  items: readonly Item[],
  step: (item: Item, index: number) => Promise<Result>,
): Promise<Result[]> {
  return items.reduce<Promise<Result[]>>(
    (previous, item, index) =>
      previous.then(async (results) => {
        results.push(await step(item, index));
        return results;
      }),
    Promise.resolve([]),
  );
}
