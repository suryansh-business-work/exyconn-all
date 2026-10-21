import { notFound } from '../../../utils/errors';
import { ClientLinkModel } from './client-link.model';
import { normalizeLink, type ClientLinkInput } from './records.validation';
import { clientLabel, clientOrThrow } from './records.client';
import { hubUrl, notifyHubContacts } from './records.notify';

/** Important links staff keep for a client; the client reads them in the hub. */
export const linksService = {
  /** Newest first — the link just added is the one people are looking for. */
  list(clientId: string) {
    return ClientLinkModel.find({ clientId }).sort({ createdAt: -1 }).lean();
  },

  async create(clientId: string, input: ClientLinkInput, createdByName: string) {
    const client = await clientOrThrow(clientId);
    const link = await ClientLinkModel.create({ clientId, ...normalizeLink(input), createdByName });
    if (input.notify) {
      await notifyHubContacts(
        clientId,
        'client-hub-shared',
        {
          clientName: clientLabel(client),
          itemKind: 'link',
          title: link.title,
          note: link.description,
          hubUrl: hubUrl('/links'),
        },
        'Client hub link added',
      );
    }
    return link.toObject();
  },

  /** The link stays with its client: only what it says and where it points change. */
  async update(id: string, input: ClientLinkInput) {
    const link = await ClientLinkModel.findByIdAndUpdate(id, normalizeLink(input), {
      new: true,
      runValidators: true,
    }).lean();
    if (!link) {
      notFound('Link');
    }
    return link;
  },

  async remove(id: string) {
    const link = await ClientLinkModel.findByIdAndDelete(id).lean();
    if (!link) {
      notFound('Link');
    }
    return link;
  },
};
