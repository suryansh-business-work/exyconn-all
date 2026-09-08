/**
 * `{{name}}` — a merge field. Whitespace inside the braces is tolerated because people
 * writing marketing copy type it, and a campaign is not the place to be pedantic about it.
 */
const MERGE_FIELD = /\{\{\s*(\w+)\s*\}\}/g;

/** The values every campaign email can merge, whichever recipient it is going to. */
export type MergeVars = {
  name: string;
  email: string;
  company: string;
  unsubscribeUrl: string;
};

/**
 * Substitutes `{{field}}` with the recipient's own value.
 *
 * Deliberately not a template language: there is no logic, no expressions and nothing a
 * marketer can write that the server will execute. A field nobody supplied renders empty
 * rather than leaving `{{firstName}}` in a customer's inbox — the failure mode that has
 * embarrassed every company that ever shipped a mail merge.
 */
export function renderMergeFields(text: string, vars: Readonly<Record<string, string>>): string {
  // Own entries only, through a Map: `{{constructor}}` must render as nothing rather than
  // reaching a prototype member and putting a function's source into somebody's inbox.
  const own = new Map(Object.entries(vars));
  return text.replaceAll(MERGE_FIELD, (_match, field: string) => own.get(field) ?? '');
}

/** How the footer reads when the copy did not place the link itself. */
const FOOTER_PREFIX = 'Unsubscribe: ';

/**
 * Guarantees the one line the law cares about.
 *
 * A campaign whose body already places `{{unsubscribeUrl}}` keeps its own wording; one
 * that forgot gets the link appended, because a marketing email without a way out is not
 * a thing this portal should be able to send.
 */
export function withUnsubscribeFooter(body: string, unsubscribeUrl: string): string {
  if (!unsubscribeUrl || body.includes(unsubscribeUrl)) {
    return body;
  }
  return `${body}\n\n${FOOTER_PREFIX}${unsubscribeUrl}`;
}
