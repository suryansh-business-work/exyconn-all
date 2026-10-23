/** The contact's or company's own page. */
export const recordPath = (object: 'CONTACT' | 'COMPANY', id: string) =>
  object === 'CONTACT' ? `/contacts/${id}` : `/companies/${id}`;

/** The search parameter naming the draft opened in place on a record's "Cold emails" tab. */
export const OPEN_DRAFT_PARAM = 'coldEmail';

/** The slug of the "Cold emails" tab on a contact's or company's page. */
export const COLD_EMAILS_TAB = 'cold-emails';

/** The record's "Cold emails" tab with one of its drafts opened in place. */
export const recordDraftPath = (object: 'CONTACT' | 'COMPANY', id: string, draftId: string) =>
  `${recordPath(object, id)}/${COLD_EMAILS_TAB}?${new URLSearchParams({ [OPEN_DRAFT_PARAM]: draftId }).toString()}`;
