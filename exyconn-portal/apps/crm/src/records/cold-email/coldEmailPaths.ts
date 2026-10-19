/** CRM > Cold emails, the section every drafted cold email is kept in. */
export const COLD_EMAILS_PATH = '/cold-emails';

/** One draft's page, with all its versions. */
export const coldEmailPath = (draftId: string) => `${COLD_EMAILS_PATH}/${draftId}`;

/** The contact's or company's own page. */
export const recordPath = (object: 'CONTACT' | 'COMPANY', id: string) =>
  object === 'CONTACT' ? `/contacts/${id}` : `/companies/${id}`;
