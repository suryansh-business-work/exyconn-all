/** CRM > Cold emails, the section every drafted cold email is kept in. */
export const COLD_EMAILS_PATH = '/cold-emails';

/** One draft's page, with all its versions. */
export const coldEmailPath = (draftId: string) => `${COLD_EMAILS_PATH}/${draftId}`;

/** The contact's or company's own page. */
export const recordPath = (object: 'CONTACT' | 'COMPANY', id: string) =>
  object === 'CONTACT' ? `/contacts/${id}` : `/companies/${id}`;

/** The search parameter naming the draft opened in place in a record's "Cold emails" section. */
export const OPEN_DRAFT_PARAM = 'coldEmail';

/** The Overview tab's slug on a record's page, where its "Cold emails" section lives. */
const OVERVIEW_TAB = 'overview';

/** The record's Overview tab with one of its drafts opened in place. */
export const recordDraftPath = (object: 'CONTACT' | 'COMPANY', id: string, draftId: string) =>
  `${recordPath(object, id)}/${OVERVIEW_TAB}?${new URLSearchParams({ [OPEN_DRAFT_PARAM]: draftId }).toString()}`;
