import { isValidObjectId } from 'mongoose';
import { ClientModel } from './clients.model';
import { badRequest } from '../../utils/errors';

/**
 * The display name an invoice or a project stores next to its `clientId`.
 *
 * Denormalised on write so a grid never joins to read it and a renamed client keeps the
 * name it had when the invoice went out — which is what the document said at the time.
 * An empty id is allowed (a project need not have a client); an id that matches nobody is
 * a mistake and is refused rather than silently stored as a blank name.
 */
export async function clientNameFor(clientId: string | null | undefined): Promise<string> {
  if (!clientId) {
    return '';
  }
  const client = isValidObjectId(clientId)
    ? await ClientModel.findById(clientId).select('name').lean()
    : null;
  if (!client) {
    badRequest('That client does not exist.');
  }
  return client.name;
}
