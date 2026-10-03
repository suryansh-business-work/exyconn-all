/** Small text helpers for the careers pages. */

/** Fills `{key}` placeholders in a copy string: fill("{n} open", { n: 3 }) → "3 open". */
export const fill = (template: string, values: Readonly<Record<string, string | number>>): string =>
  template.replaceAll(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );

/** The singular copy for one, the plural (with `{n}`) otherwise. */
export const countLabel = (count: number, one: string, many: string): string =>
  count === 1 ? one : fill(many, { n: count });

/** Clamps a live count into a scene's range; undefined (the shape's own default) when 0. */
export const sceneCount = (count: number, min: number, max: number): number | undefined =>
  count > 0 ? Math.min(max, Math.max(min, count)) : undefined;

/** Proof-strip stats from live counts; a zero is left out rather than shown as "0 roles". */
export const liveStats = (
  items: readonly { count: number; label: string }[]
): { value: string; label: string }[] =>
  items
    .filter((item) => item.count > 0)
    .map((item) => ({ value: String(item.count), label: item.label }));

/**
 * Chapter numbers for the chapters a page actually shows, in order: chapterNumbers(["about",
 * "culture", "roles"], { culture: false }) → { about: 1, roles: 2 }. Absent keys count as shown.
 */
export const chapterNumbers = <K extends string>(
  order: readonly K[],
  shown: Partial<Record<K, boolean>>
): Partial<Record<K, number>> => {
  const numbers: Partial<Record<K, number>> = {};
  let next = 1;
  order.forEach((key) => {
    if (shown[key] !== false) {
      numbers[key] = next;
      next += 1;
    }
  });
  return numbers;
};
