/**
 * `<prefix>-<n>` not used by any item yet — for a new button, row, card or case, whose id
 * names its output on the canvas and so must be unique within the node.
 */
export function nextId(
  prefix: string,
  items: readonly Record<string, unknown>[],
  key = 'id',
): string {
  const taken = new Set(items.map((item) => String(item[key] ?? '')));
  let n = items.length + 1;
  while (taken.has(`${prefix}-${n}`)) {
    n += 1;
  }
  return `${prefix}-${n}`;
}

/** The longest option id (schema.ts `id`). */
export const OPTION_ID_MAX = 64;
