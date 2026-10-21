import { notFound } from '../../../utils/errors';
import { tableQuery, type TableQueryInput } from '../../../utils/tableQuery';
import { withIds } from '../../../utils/serialize';
import { registerTable } from '../../table-transfer/registry';
import {
  ClientCommunicationModel,
  type ClientCommunicationDocument,
} from './client-communication.model';
import { normalizeCommunication, type ClientCommunicationInput } from './records.validation';
import { clientLabel, clientOrThrow } from './records.client';
import { hubUrl, notifyHubContacts } from './records.notify';

const SORTS = ['occurredAt', 'type', 'subject', 'createdAt'];
const SEARCH = ['subject', 'summary', 'participants'];

/** Admin › Clients › client › Communication: one client's log, picked by a clientId filter. */
export const STAFF_COMMUNICATION_TABLE = {
  searchFields: SEARCH,
  filterFields: ['clientId', 'type'],
  sortFields: SORTS,
  defaultSort: { field: 'occurredAt', dir: 'DESC' as const },
};
/** The client hub's log: the client is fixed by the pass, never by a filter. */
const HUB_COMMUNICATION_TABLE = { ...STAFF_COMMUNICATION_TABLE, filterFields: ['type'] };
registerTable('listClientCommunicationsPaged', STAFF_COMMUNICATION_TABLE);
registerTable('clientHubCommunications', HUB_COMMUNICATION_TABLE);

const asPage = (page: { rows: unknown[]; totalCount: number }) => ({
  rows: withIds(page.rows as Array<ClientCommunicationDocument & { _id: unknown }>),
  totalCount: page.totalCount,
});

/** Calls, emails, meetings and messages with a client, as both sides read them. */
export const communicationsService = {
  async staffPage(input: TableQueryInput) {
    return asPage(await tableQuery(ClientCommunicationModel, input, STAFF_COMMUNICATION_TABLE));
  },

  async hubPage(clientId: string, input: TableQueryInput) {
    return asPage(
      await tableQuery(ClientCommunicationModel, input, HUB_COMMUNICATION_TABLE, { clientId }),
    );
  },

  async create(clientId: string, input: ClientCommunicationInput, loggedByName: string) {
    await clientOrThrow(clientId);
    const entry = await ClientCommunicationModel.create({
      clientId,
      ...normalizeCommunication(input),
      loggedByName,
    });
    if (input.notify) {
      await communicationsService.notify(String(entry._id));
    }
    return entry.toObject();
  },

  async update(id: string, input: ClientCommunicationInput) {
    const entry = await ClientCommunicationModel.findByIdAndUpdate(
      id,
      normalizeCommunication(input),
      { new: true, runValidators: true },
    ).lean();
    if (!entry) {
      notFound('Communication');
    }
    if (input.notify) {
      await communicationsService.notify(id);
    }
    return entry;
  },

  async remove(id: string) {
    const entry = await ClientCommunicationModel.findByIdAndDelete(id).lean();
    if (!entry) {
      notFound('Communication');
    }
    return entry;
  },

  /**
   * Emails the client's hub contacts about an entry — once. The entry is claimed before any
   * email goes, so a retried or repeated save never sends the same notice twice.
   */
  async notify(id: string) {
    const entry = await ClientCommunicationModel.findOneAndUpdate(
      { _id: id, notifiedAt: null },
      { $set: { notifiedAt: new Date() } },
      { new: true },
    ).lean();
    if (!entry) {
      return [];
    }
    const client = await clientOrThrow(entry.clientId);
    return notifyHubContacts(
      entry.clientId,
      'client-hub-communication',
      {
        clientName: clientLabel(client),
        subject: entry.subject,
        summary: entry.summary,
        hubUrl: hubUrl('/communications'),
      },
      'Client communication logged',
    );
  },
};
