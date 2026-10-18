import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { currentOrganizationId } from '../../lib/tenant';
import { ConfigurationError } from '../../utils/errors';
import { enabledMailboxes } from '../gmail/gmail.accounts';
import { crmEmailSender, sendCrmEmail, type SendCrmEmailInput } from '../gmail/gmail.crm';
import {
  enabledMicrosoftMailboxes,
  isMicrosoftAccount,
  sendMicrosoftCrmEmail,
} from '../microsoft-mail';

export type EmailProvider = 'GMAIL' | 'MICROSOFT';

/** A provider's usable mailboxes; none while its OAuth client is not set up. */
async function mailboxesOrNone<T>(read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return [];
    }
    throw error;
  }
}

/** Whether the caller's company is the platform operator, the only one whose CRM sends mail. */
async function isOperatorCrm(): Promise<boolean> {
  const operator = await platformOperatorOrganizationId();
  return Boolean(operator) && currentOrganizationId() === operator;
}

/**
 * Every mailbox a CRM email may go from — Gmail and Microsoft, enabled and connected — or none
 * outside the operator's CRM.
 */
export async function crmEmailSenders() {
  if (!(await isOperatorCrm())) {
    return [];
  }
  const [gmail, microsoft] = await Promise.all([
    mailboxesOrNone(enabledMailboxes),
    mailboxesOrNone(enabledMicrosoftMailboxes),
  ]);
  return [
    ...gmail.map(({ id, email }) => ({ id, email, provider: 'GMAIL' as EmailProvider })),
    ...microsoft.map(({ id, email }) => ({ id, email, provider: 'MICROSOFT' as EmailProvider })),
  ];
}

/** Whether each provider has a usable mailbox for the caller's CRM. */
export async function emailReadiness() {
  const senders = await crmEmailSenders();
  return {
    gmail: senders.some((sender) => sender.provider === 'GMAIL'),
    microsoft: senders.some((sender) => sender.provider === 'MICROSOFT'),
  };
}

/** The default sender for a record, across both providers (see crmEmailSender). */
export async function defaultEmailSender(object: 'CONTACT' | 'COMPANY', id: string) {
  const senders = await crmEmailSenders();
  return crmEmailSender(
    object,
    id,
    senders.map((sender) => sender.id),
  );
}

/** Sends from whichever provider owns the chosen mailbox. */
export async function sendFromAnyMailbox(input: SendCrmEmailInput, sentByName: string) {
  if (await isMicrosoftAccount(input.fromAccountId)) {
    return { provider: 'MICROSOFT' as const, sent: await sendMicrosoftCrmEmail(input, sentByName) };
  }
  return { provider: 'GMAIL' as const, sent: await sendCrmEmail(input, sentByName) };
}
