import { runAsPlatform } from '../../lib/tenant';
import { env } from '../../config/env';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailer } from '../email/email.service';
import { ClientModel } from '../clients/clients.model';
import { ClientContactModel } from './contact.model';

export interface ClientContactInput {
  clientId: string;
  name: string;
  email: string;
}

/**
 * Who at a client may use the client hub — given and taken away from Admin › Clients. Runs in
 * the administrator's company, so a client and its contacts are always the same company's.
 */
export const contactsService = {
  list(clientId: string) {
    return ClientContactModel.find({ clientId }).sort({ createdAt: 1 }).lean();
  },

  /** Gives somebody access and emails them where to sign in. */
  async add(input: ClientContactInput) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (name === '' || name.length > 120) badRequest('Enter the person’s name.');
    if (!isEmailAddress(email)) badRequest('Enter a valid email address.');
    const client = await ClientModel.findById(input.clientId).select('name company').lean();
    if (!client) notFound('Client');
    // Addresses are unique across the platform: one address signs in to one client.
    const taken = await runAsPlatform(() => ClientContactModel.exists({ email }));
    if (taken) badRequest('That email already has client hub access.');

    const contact = await ClientContactModel.create({ clientId: input.clientId, name, email });
    emailer
      .send({
        template: 'client-hub-invite',
        to: email,
        variables: { name, clientName: client.company || client.name, hubUrl: env.clientHubUrl },
        triggeredBy: 'Client hub access granted',
      })
      .catch((error: unknown) => logger.error({ err: error }, 'Client hub invite email failed'));
    return contact.toObject();
  },

  /** Switching access off signs the person out of the client hub at once. */
  async setActive(id: string, active: boolean) {
    const contact = await ClientContactModel.findByIdAndUpdate(
      id,
      active ? { active } : { active, $inc: { tokenVersion: 1 } },
      { new: true },
    ).lean();
    if (!contact) notFound('Client contact');
    return contact;
  },

  async remove(id: string) {
    const result = await ClientContactModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) notFound('Client contact');
    return true;
  },
};
