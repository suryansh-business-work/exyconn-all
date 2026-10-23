import { runForOrganization } from '../../lib/tenant';
import { GmailAccountModel } from '../gmail/gmail.models';
import { MicrosoftMailAccountModel } from '../microsoft-mail/microsoft.models';

/** Where a person's own mailbox changes and sends show in Admin > Audit. */
export const MY_MAILBOX_AUDIT_MODULE = 'MyMailbox';

export type MailboxProvider = 'GMAIL' | 'MICROSOFT';

/** The owner an OAuth state names: '' (a CRM connection) or a user id. */
export function ownerOf(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value;
}

/**
 * Makes a newly connected personal mailbox its owner's default when they have none yet, so
 * their first mailbox is the one the email window sends from.
 */
export function claimDefaultIfNone(
  organizationId: string,
  ownerUserId: string,
  provider: MailboxProvider,
  id: unknown,
): Promise<void> {
  return runForOrganization(organizationId, async () => {
    const flagged = { ownerUserId, isDefault: true };
    const [gmail, microsoft] = await Promise.all([
      GmailAccountModel.exists(flagged),
      MicrosoftMailAccountModel.exists(flagged),
    ]);
    if (gmail || microsoft) {
      return;
    }
    const mine = { _id: id, ownerUserId };
    const set = { $set: { isDefault: true } };
    if (provider === 'GMAIL') {
      await GmailAccountModel.updateOne(mine, set);
    } else {
      await MicrosoftMailAccountModel.updateOne(mine, set);
    }
  });
}

/**
 * The audit line for a mailbox connected through an OAuth callback: a person's own mailbox is
 * audited as theirs, a CRM mailbox under the CRM's module as before.
 */
export function connectedAuditLine(
  ownerUserId: string | null | undefined,
  crm: Readonly<{ module: string; summary: string }>,
  email: string,
) {
  if (ownerOf(ownerUserId)) {
    return { module: MY_MAILBOX_AUDIT_MODULE, summary: `Connected their own mailbox ${email}` };
  }
  return crm;
}
