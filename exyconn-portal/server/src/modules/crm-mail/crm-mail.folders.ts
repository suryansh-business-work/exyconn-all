/** The folders of CRM > Mail, each a cut of the stored conversations by Gmail label. */
export const MAIL_FOLDERS = ['INBOX', 'SENT', 'STARRED', 'ALL'] as const;
export type MailFolder = (typeof MAIL_FOLDERS)[number];

/** The Mongo filter that keeps one folder's conversations. All mail keeps every one. */
export function folderFilter(folder: MailFolder): Record<string, unknown> {
  if (folder === 'STARRED') {
    return { starred: true };
  }
  if (folder === 'ALL') {
    return {};
  }
  return { labelIds: folder };
}
