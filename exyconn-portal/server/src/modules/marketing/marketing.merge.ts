/**
 * Marketing's mail merge: the shared `{{field}}` substitution, plus the one line the law
 * cares about.
 *
 * The substitution itself is `utils/mergeFields`, shared with the AI module's prompts —
 * including its Map-of-own-entries lookup, so `{{constructor}}` renders as nothing rather
 * than putting a function into somebody's inbox.
 */
import { renderMergeFields } from '../../utils/mergeFields';

export { renderMergeFields };

/** The values every campaign email can merge, whichever recipient it is going to. */
export type MergeVars = {
  name: string;
  email: string;
  company: string;
  unsubscribeUrl: string;
};

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
