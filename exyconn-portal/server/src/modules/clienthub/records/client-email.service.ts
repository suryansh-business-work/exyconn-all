import { badRequest } from '../../../utils/errors';
import { escapeHtml, rawHtml } from '../../email/email.render';
import { ClientCommunicationModel } from './client-communication.model';
import { RECORD_LIMITS, cleanText } from './records.validation';
import { clientLabel, clientOrThrow } from './records.client';
import { hubContacts, hubUrl, sendEach } from './records.notify';

export interface EmailClientInput {
  /** Addresses picked from the client's own (see `recipients`); nothing else is accepted. */
  to: string[];
  subject: string;
  message: string;
}

/** Plain text with its line breaks kept, safe to drop into the template as HTML. */
const asParagraphs = (text: string) => rawHtml(escapeHtml(text).replaceAll('\n', '<br />'));

/**
 * "Email client" on Admin › Clients › client. Mail goes only to addresses the client already
 * has on file — their main address and their hub contacts — so the action can never be used
 * to mail strangers from the company's address. Every send is filed in the communication log.
 */
export const clientEmailService = {
  /** The client's own address first, then each active hub contact; one entry per address. */
  async recipients(clientId: string) {
    const [client, contacts] = await Promise.all([clientOrThrow(clientId), hubContacts(clientId)]);
    const all = [
      { name: clientLabel(client), email: client.email },
      ...contacts.map((contact) => ({ name: contact.name, email: contact.email })),
    ];
    const seen = new Set<string>();
    const unique = all.filter((recipient) => {
      const email = recipient.email.toLowerCase();
      if (seen.has(email)) {
        return false;
      }
      seen.add(email);
      return true;
    });
    return { clientName: clientLabel(client), recipients: unique };
  },

  async send(clientId: string, input: EmailClientInput, senderName: string) {
    const subject = cleanText(input.subject, RECORD_LIMITS.subject, 'Write a subject.', true);
    const message = cleanText(input.message, RECORD_LIMITS.message, 'Write a message.', true);
    const known = await clientEmailService.recipients(clientId);
    const wanted = new Set(input.to.map((email) => email.trim().toLowerCase()));
    const recipients = known.recipients.filter((recipient) =>
      wanted.has(recipient.email.toLowerCase()),
    );
    if (recipients.length === 0 || recipients.length !== wanted.size) {
      badRequest('Pick who to email from the client’s addresses.');
    }
    const sent = await sendEach(
      recipients,
      'client-message',
      (recipient) => ({
        name: recipient.name,
        clientName: known.clientName,
        subject,
        message: asParagraphs(message),
        senderName,
        hubUrl: hubUrl('/dashboard'),
      }),
      `Email to client from ${senderName}`,
    );
    if (sent.length === 0) {
      badRequest('The email could not be sent. Check Tech › Email and try again.');
    }
    // The client already has the email, so the log entry needs no notice of its own.
    await ClientCommunicationModel.create({
      clientId,
      type: 'EMAIL',
      occurredAt: new Date(),
      subject,
      summary: message.slice(0, RECORD_LIMITS.summary),
      details: message.slice(0, RECORD_LIMITS.details),
      participants: sent.join(', '),
      loggedByName: senderName,
      notifiedAt: new Date(),
    });
    return sent.length;
  },
};
