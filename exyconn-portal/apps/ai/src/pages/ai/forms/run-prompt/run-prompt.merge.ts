/** RHF nests the per-variable fields under one object, so every field name carries this. */
export const VARIABLE_FIELD_PREFIX = 'variables.';

/**
 * Mirrors the grammar in `server/src/utils/mergeFields.ts` exactly, so the preview cannot lie
 * about the run. It cannot import it — the server is a plain-node build and these packages are
 * consumed as source — so the one rule is: if that regex changes, change this one.
 *
 * The BEHAVIOUR differs on purpose. The server renders an unsupplied field as empty, because a
 * customer must never receive `{{firstName}}`. The preview leaves it visible, because the whole
 * point of a preview is to show which variables are still unfilled before somebody pays to run
 * it.
 */
const MERGE_FIELD = /\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g;

/**
 * Fills a prompt's placeholders for the preview. Client-side only: the server renders the
 * prompt it actually sends, and this exists so somebody can see what they are about to pay
 * for before they press Run.
 */
export function renderMergeFields(content: string, values: Record<string, string>): string {
  return content.replaceAll(MERGE_FIELD, (_match, name: string) => values[name] || `{{${name}}}`);
}
