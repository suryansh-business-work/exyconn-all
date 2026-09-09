/**
 * `{{ name }}` — the whole template language, and the one place that implements it.
 *
 * It lived in two copies that quietly disagreed. Marketing looked values up through a Map of
 * own entries; the AI module used plain property access, so `{{constructor}}` reached
 * `Object.prototype` and put a function's source into a prompt somebody was about to pay a
 * model to read. Same name, same braces, different safety. One implementation now, and it is
 * the careful one.
 *
 * Deliberately NOT a template language: no expressions, no calls, no property paths. A prompt
 * is authored by one person and run by another, and a campaign is written by a marketer and
 * sent to customers — in both cases the grammar has to be small enough that reading it is the
 * same as auditing it.
 */

/**
 * A field name: a letter, then word characters or hyphens. Whitespace inside the braces is
 * tolerated because people writing copy type it, and a campaign is not the place to be
 * pedantic about a space.
 */
const MERGE_FIELD = /\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g;

/** Every distinct field a template uses, in the order it first appears. */
export function extractMergeFields(content: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const match of content.matchAll(MERGE_FIELD)) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      names.push(match[1]);
    }
  }
  return names;
}

/**
 * Substitutes each `{{field}}` with its value.
 *
 * Values are read through a Map of OWN entries, never by property access: `{{constructor}}`,
 * `{{__proto__}}` and friends must render as nothing rather than reaching a prototype member.
 *
 * A field nobody supplied renders EMPTY rather than leaving `{{firstName}}` in a customer's
 * inbox — the failure mode that has embarrassed every company that ever shipped a mail merge.
 */
export function renderMergeFields(
  content: string,
  values: Readonly<Record<string, string>>,
): string {
  const own = new Map(Object.entries(values));
  return content.replaceAll(MERGE_FIELD, (_match, name: string) => own.get(name) ?? '');
}

/** One `{ name, value }` pair as the API takes it. */
export interface MergeFieldInput {
  name: string;
  value: string;
}

/** Turns the wire shape into the lookup `renderMergeFields` reads. Later wins. */
export function toValueMap(variables: readonly MergeFieldInput[] = []): Record<string, string> {
  return Object.fromEntries(variables.map((variable) => [variable.name, variable.value ?? '']));
}
