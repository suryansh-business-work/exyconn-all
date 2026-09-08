/**
 * `{{ name }}` — the only thing a prompt may interpolate.
 *
 * Deliberately just a name: no expressions, no calls, no property paths that could reach
 * into anything. A prompt is authored by one person and run by another, so the template
 * language has to be small enough that reading it is the same as auditing it.
 */
const MERGE_FIELD = /\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g;

/** Every distinct variable a prompt uses, in the order it first appears. */
export function extractMergeFields(content: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const match of content.matchAll(MERGE_FIELD)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/**
 * Fills a prompt's variables in. An unknown or omitted variable renders as nothing rather
 * than leaving `{{ name }}` in the text: the model would happily answer about the literal
 * braces, and a half-filled prompt costs the same as a good one.
 */
export function renderMergeFields(content: string, values: Record<string, string>): string {
  return content.replaceAll(MERGE_FIELD, (_match, name: string) => values[name] ?? '');
}

/** One `{ name, value }` pair as the API takes it. */
export interface PromptVariableInput {
  name: string;
  value: string;
}

/** Turns the wire shape into the lookup `renderMergeFields` reads. Later wins. */
export function toValueMap(variables: readonly PromptVariableInput[] = []): Record<string, string> {
  return Object.fromEntries(variables.map((variable) => [variable.name, variable.value ?? '']));
}
