import { isValidObjectId } from 'mongoose';
import { notFound } from '../../../utils/errors';
import { ClientSharedItemModel, type SharedItemKind } from './client-shared-item.model';
import { RECORD_LIMITS, cleanText } from './records.validation';
import { clientLabel, clientOrThrow } from './records.client';
import { hubUrl, notifyHubContacts } from './records.notify';
import { assertShareable, sourceContent, sourceViews } from './shares.sources';

export interface ShareInput {
  kind: SharedItemKind;
  refId: string;
  note?: string | null;
  /** Email the client's hub contacts. Sent at most once per shared record. */
  notify?: boolean | null;
}

/** How the item is named in an email ("We shared a contract with you"). */
const KIND_WORD: Record<SharedItemKind, string> = {
  CONTRACT: 'contract',
  DOCUMENT: 'document',
  POLICY: 'policy',
};

type ShareRow = Awaited<ReturnType<typeof listRows>>[number];
const listRows = (clientId: string) =>
  ClientSharedItemModel.find({ clientId }).sort({ createdAt: -1 }).lean();

/** Each share with its record's live title, status and signature. */
async function withViews(rows: ShareRow[], keepMissing: boolean) {
  const views = await sourceViews(rows);
  return rows.flatMap((row) => {
    const view = views.get(`${row.kind}:${row.refId}`);
    if (!view && !keepMissing) {
      return [];
    }
    return [
      {
        ...row,
        id: String(row._id),
        sharedAt: row.createdAt,
        // A record deleted in Legal stays listed for staff, so they can take the share down.
        ...(view ?? { title: '', status: 'REMOVED', fileUrl: '', hasContent: false }),
      },
    ];
  });
}

/**
 * Contracts, documents and policies shared with a client. Staff see every share; the client
 * sees only those whose record still exists.
 */
export const sharesService = {
  async staffList(clientId: string) {
    return withViews(await listRows(clientId), true);
  },

  async hubList(clientId: string) {
    return withViews(await listRows(clientId), false);
  },

  /** Shares a record (again sharing it only updates the note), then tells the client once. */
  async share(clientId: string, input: ShareInput, sharedByName: string) {
    const client = await clientOrThrow(clientId);
    await assertShareable(input.kind, input.refId);
    const note = cleanText(
      input.note,
      RECORD_LIMITS.note,
      'Keep the note under 1000 characters.',
      false,
    );
    const key = { clientId, kind: input.kind, refId: input.refId };
    const row = await ClientSharedItemModel.findOneAndUpdate(
      key,
      { $set: { note }, $setOnInsert: { sharedByName } },
      { upsert: true, new: true },
    ).lean();
    const [item] = await withViews([row], true);
    if (input.notify) {
      await sharesService.notify(item.id, clientLabel(client), item.title);
    }
    return item;
  },

  async unshare(id: string) {
    const row = await ClientSharedItemModel.findByIdAndDelete(id).lean();
    if (!row) {
      notFound('Shared item');
    }
    return row;
  },

  /** Claims the share's one notice before sending, so a repeated share never mails twice. */
  async notify(id: string, clientName: string, title: string) {
    const row = await ClientSharedItemModel.findOneAndUpdate(
      { _id: id, notifiedAt: null },
      { $set: { notifiedAt: new Date() } },
      { new: true },
    ).lean();
    if (!row) {
      return [];
    }
    return notifyHubContacts(
      row.clientId,
      'client-hub-shared',
      {
        clientName,
        itemKind: KIND_WORD[row.kind],
        title,
        note: row.note,
        hubUrl: hubUrl('/documents'),
      },
      'Client hub item shared',
    );
  },

  /** The shared record's text, for the signed-in client's own share only. */
  async hubContent(clientId: string, id: string) {
    const row = isValidObjectId(id)
      ? await ClientSharedItemModel.findOne({ _id: id, clientId }).lean()
      : null;
    if (!row) {
      notFound('Shared item');
    }
    return sourceContent(row.kind, row.refId);
  },
};
