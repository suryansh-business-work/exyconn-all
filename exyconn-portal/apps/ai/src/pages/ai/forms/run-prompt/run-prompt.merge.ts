/** RHF nests the per-variable fields under one object, so every field name carries this. */
export const VARIABLE_FIELD_PREFIX = 'variables.';

/** Mirrors the server's `{{name}}` grammar exactly, so the preview cannot lie about the run. */
const MERGE_FIELD = /\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g;

/**
 * Fills a prompt's placeholders for the preview. Client-side only: the server renders the
 * prompt it actually sends, and this exists so somebody can see what they are about to pay
 * for before they press Run.
 */
export function renderMergeFields(content: string, values: Record<string, string>): string {
  return content.replaceAll(MERGE_FIELD, (_match, name: string) => values[name] || `{{${name}}}`);
}
