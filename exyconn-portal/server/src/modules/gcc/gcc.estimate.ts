import { parseEstimateJson, type Estimate } from '@exyconn/gcc-cost';
import { badRequest } from '../../utils/errors';

/** How many schema issues an error message names; the rest are summarised by count. */
const ISSUES_SHOWN = 3;

/**
 * Reads an estimate the website sent. Size (LIMITS.payloadBytes), JSON syntax, prototype keys
 * and the full schema are checked by the shared package; anything else is refused with a
 * message the calculator can show. Totals are never read — callers recompute them.
 */
export function readEstimate(json: string): Estimate {
  const result = parseEstimateJson(json);
  if (result.ok) {
    return result.estimate;
  }
  if (result.reason === 'invalid') {
    const shown = result.issues.slice(0, ISSUES_SHOWN).join('; ');
    badRequest(`${result.message} ${shown}`);
  }
  badRequest(result.message);
}
