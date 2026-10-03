import { COOKIE_POLICY } from "./cookies";
import { GRIEVANCE } from "./grievance";
import { LEGAL_REQUESTS } from "./legal-requests";
import { PRIVACY_POLICY } from "./privacy";
import type { LegalDocument, LegalDocumentKey } from "./types";

const DOCUMENTS: Readonly<Record<LegalDocumentKey, LegalDocument>> = {
  privacy: PRIVACY_POLICY,
  cookies: COOKIE_POLICY,
  legal: LEGAL_REQUESTS,
  grievance: GRIEVANCE,
};

/**
 * The one place the legal pages get their wording from. Today it is this repository's text;
 * moving to the portal's published policies means returning the same `LegalDocument` from a
 * portal query here — the pages already await it and need no change.
 */
export async function getLegalDocument(key: LegalDocumentKey): Promise<LegalDocument> {
  return DOCUMENTS[key];
}
