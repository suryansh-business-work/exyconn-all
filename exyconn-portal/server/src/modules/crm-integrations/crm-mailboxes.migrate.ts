import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { ORGANIZATION_FIELD } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { GmailAccountModel } from '../gmail/gmail.models';
import { MicrosoftMailAccountModel } from '../microsoft-mail/microsoft.models';

/** The platform-wide unique index the mailboxes had while they were platform rows. */
const LEGACY_EMAIL_INDEX = 'email_1';

type MailboxModel = Pick<Model<unknown>, 'collection' | 'modelName' | 'createIndexes'>;

const MAILBOX_MODELS: readonly MailboxModel[] = [GmailAccountModel, MicrosoftMailAccountModel];

/** A mailbox stored while mailboxes were platform rows: it names no company. */
const withoutOrganization = { [ORGANIZATION_FIELD]: null };

/** Drops the old platform-wide `email` unique index if it is still there; true when it was. */
async function dropLegacyIndex(model: MailboxModel): Promise<boolean> {
  const indexes = await model.collection.indexes();
  if (!indexes.some((index) => index.name === LEGACY_EMAIL_INDEX)) {
    return false;
  }
  await model.collection.dropIndex(LEGACY_EMAIL_INDEX);
  return true;
}

/**
 * Moves one model's company-less mailboxes into the operator, then swaps its indexes: the
 * per-company (organizationId, email) unique index is built BEFORE the old platform-wide one
 * goes, so the collection is never without a uniqueness guarantee.
 */
async function moveIntoOperator(model: MailboxModel, operator: Types.ObjectId): Promise<void> {
  // Straight to the driver, like the tenancy's own legacy migration: only rows naming no
  // company match, so a rerun changes nothing.
  const { modifiedCount } = await model.collection.updateMany(withoutOrganization, {
    $set: { [ORGANIZATION_FIELD]: operator },
  });
  await model.createIndexes();
  const dropped = await dropLegacyIndex(model);
  const indexNote = dropped ? `dropped ${LEGACY_EMAIL_INDEX}` : `no ${LEGACY_EMAIL_INDEX} left`;
  logger.info(
    `${model.modelName}: moved ${modifiedCount} mailbox(es) into the operator organization; ${indexNote}`,
  );
}

/**
 * Connected mailboxes used to be platform rows that only the operator's CRM could reach. Each
 * now belongs to one company, so every mailbox stored before is given to the operator — the
 * only company that could have connected it. Runs once at boot (runOnce ledger, as the
 * platform). Rows are only stamped, never deleted or rewritten.
 */
export async function assignMailboxesToOperator(): Promise<void> {
  const counts = await Promise.all(
    MAILBOX_MODELS.map((model) => model.collection.countDocuments(withoutOrganization)),
  );
  if (counts.every((count) => count === 0)) {
    return;
  }
  const operator = await platformOperatorOrganizationId();
  if (!operator) {
    // Not recorded in the ledger, so the next boot tries again once an operator is flagged.
    throw new Error('No platform operator organization to move the connected mailboxes into.');
  }
  const operatorId = new Types.ObjectId(operator);
  // Each model owns its own collection, so the two are moved side by side.
  await Promise.all(MAILBOX_MODELS.map((model) => moveIntoOperator(model, operatorId)));
}
