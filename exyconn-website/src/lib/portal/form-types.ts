import { portalRequest } from "./client";

/**
 * The form identifiers the portal accepts, read from the portal itself.
 *
 * The list used to be a literal here AND a literal in the server's
 * `website.constants.ts`, which is two places for one rule: adding a form meant editing
 * both, and forgetting one meant a form that silently 400s. The server's list is now the
 * only one, exposed as the `websiteFormTypes` query, and this module is the site's read
 * of it.
 *
 * Cached for the life of the process: the list changes when the server is deployed, and
 * a lookup per submission would put a second round-trip in front of every form.
 */
let cached: Set<string> | null = null;

export async function getWebsiteFormTypes(): Promise<Set<string>> {
  if (cached) {
    return cached;
  }
  const data = await portalRequest<{ websiteFormTypes: string[] }>(`query { websiteFormTypes }`);
  cached = new Set(data.websiteFormTypes);
  return cached;
}
