import type { Model } from 'mongoose';
import { ORGANIZATION_FIELD } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { GmailAccountModel } from '../gmail/gmail.models';
import { MicrosoftMailAccountModel } from '../microsoft-mail/microsoft.models';

interface IndexInfo {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
}

type MailboxModel = Pick<Model<unknown>, 'collection' | 'modelName' | 'createIndexes'>;

const MAILBOX_MODELS: readonly MailboxModel[] = [GmailAccountModel, MicrosoftMailAccountModel];

/** The old guard: one row per (organization, email), which left no room for a personal row. */
const isCompanyEmailIndex = (index: IndexInfo) =>
  index.unique === true && Object.keys(index.key).join() === `${ORGANIZATION_FIELD},email`;

/** Builds the (organization, email, owner) index, then drops the old one if it is there. */
async function swapIndex(model: MailboxModel): Promise<void> {
  await model.createIndexes();
  const indexes = (await model.collection.indexes()) as IndexInfo[];
  const legacy = indexes.find(isCompanyEmailIndex);
  if (legacy?.name) {
    await model.collection.dropIndex(legacy.name);
    logger.info(`${model.modelName}: dropped ${legacy.name}; personal mailboxes may share it`);
  }
}

/**
 * A person may now connect, for their own email, an address their company also uses in the
 * CRM: mailboxes are unique per (organization, email, owner). The new index is built before
 * the old one goes, so the collection is never without a unique guard. Collection-wide, so it
 * runs once as the platform (runOnce ledger at boot). No row is changed.
 */
export async function allowPersonalMailboxes(): Promise<void> {
  // Each model owns its own collection, so the two are swapped side by side.
  await Promise.all(MAILBOX_MODELS.map((model) => swapIndex(model)));
}
