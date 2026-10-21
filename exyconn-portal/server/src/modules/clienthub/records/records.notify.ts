import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { emailer } from '../../email/email.service';
import type { EmailVariables } from '../../email/email.render';
import { ClientContactModel } from '../contact.model';

/** Where a section of the client hub lives, for the button in an email. */
export const hubUrl = (path: string) => `${env.clientHubUrl}${path}`;

/** Everyone at the client who can open the client hub — who hub notices go to. */
export function hubContacts(clientId: string) {
  return ClientContactModel.find({ clientId, active: true }).select('name email').lean();
}

interface Recipient {
  name: string;
  email: string;
}

/**
 * Sends one template to each recipient, one email each so nobody sees another's address.
 * A failed delivery is logged (and recorded FAILED in the email log by the emailer) without
 * stopping the others. Resolves to the addresses that were sent.
 */
export async function sendEach(
  recipients: readonly Recipient[],
  template: string,
  variables: (recipient: Recipient) => EmailVariables,
  triggeredBy: string,
): Promise<string[]> {
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      emailer.send({ template, to: recipient.email, variables: variables(recipient), triggeredBy }),
    ),
  );
  const sent: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      sent.push(recipients[index].email);
    } else {
      logger.error({ err: result.reason, template }, 'Client hub email failed');
    }
  });
  return sent;
}

/** Tells every hub contact at the client about something new in their hub. */
export async function notifyHubContacts(
  clientId: string,
  template: string,
  variables: EmailVariables,
  triggeredBy: string,
): Promise<string[]> {
  const contacts = await hubContacts(clientId);
  return sendEach(
    contacts,
    template,
    (contact) => ({ ...variables, name: contact.name }),
    triggeredBy,
  );
}
