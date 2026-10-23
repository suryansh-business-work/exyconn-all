import { Types } from 'mongoose';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { assignMailboxesToOperator } from '../../../../src/modules/crm-integrations/crm-mailboxes.migrate';
import { GmailAccountModel } from '../../../../src/modules/gmail/gmail.models';
import { MicrosoftMailAccountModel } from '../../../../src/modules/microsoft-mail/microsoft.models';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { logger } from '../../../../src/utils/logger';

const MODELS = [GmailAccountModel, MicrosoftMailAccountModel] as const;
const LEGACY_INDEX = 'email_1';
// Per company and per owner since personal mailboxes (my-mailboxes.migrate).
const PER_COMPANY_INDEX = 'organizationId_1_email_1_ownerUserId_1';

/** The platform-wide unique index the mailboxes had while they were platform rows. */
const addLegacyIndex = () =>
  Promise.all(
    MODELS.map((model) =>
      model.collection.createIndex({ email: 1 }, { unique: true, name: LEGACY_INDEX }),
    ),
  );

/** A mailbox stored before mailboxes belonged to a company: straight to the driver, no company. */
const legacyRow = (model: (typeof MODELS)[number], email: string, fields = {}) =>
  model.collection.insertOne({ email, refreshToken: 'sealed', ...fields });

const indexNames = async (model: (typeof MODELS)[number]) =>
  (await model.collection.indexes()).map((index) => index.name);

const ownersOf = (model: (typeof MODELS)[number]) =>
  model.collection
    .find({}, { projection: { email: 1, organizationId: 1 } })
    .sort({ email: 1 })
    .toArray()
    .then((rows) => rows.map((row) => [row.email, row.organizationId?.toHexString() ?? null]));

const seedOperator = () =>
  runAsPlatform(() =>
    OrganizationModel.create({
      name: 'Exyconn',
      slug: 'exyconn',
      currency: 'USD',
      isPlatformOperator: true,
    }),
  ).then((row) => row._id.toHexString());

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  await Promise.all(MODELS.map((model) => model.createIndexes()));
  await addLegacyIndex();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('assignMailboxesToOperator', () => {
  it('does nothing, and needs no operator, when every mailbox already names a company', async () => {
    const company = new Types.ObjectId();
    await legacyRow(GmailAccountModel, 'sales@acme.test', { organizationId: company });

    await expect(assignMailboxesToOperator()).resolves.toBeUndefined();

    await expect(ownersOf(GmailAccountModel)).resolves.toEqual([
      ['sales@acme.test', company.toHexString()],
    ]);
    // Nothing to move, so the indexes are left as they are.
    await expect(indexNames(GmailAccountModel)).resolves.toContain(LEGACY_INDEX);
  });

  it('gives every company-less mailbox to the operator and leaves the others alone', async () => {
    const operatorId = await seedOperator();
    const customer = new Types.ObjectId();
    await legacyRow(GmailAccountModel, 'sales@exyconn.test');
    await legacyRow(GmailAccountModel, 'team@customer.test', { organizationId: customer });
    await legacyRow(MicrosoftMailAccountModel, 'ops@exyconn.test');
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);

    await assignMailboxesToOperator();

    await expect(ownersOf(GmailAccountModel)).resolves.toEqual([
      ['sales@exyconn.test', operatorId],
      ['team@customer.test', customer.toHexString()],
    ]);
    await expect(ownersOf(MicrosoftMailAccountModel)).resolves.toEqual([
      ['ops@exyconn.test', operatorId],
    ]);
    expect(info).toHaveBeenCalledWith(
      'GmailAccount: moved 1 mailbox(es) into the operator organization; dropped email_1',
    );
    expect(info).toHaveBeenCalledWith(
      'MicrosoftMailAccount: moved 1 mailbox(es) into the operator organization; dropped email_1',
    );
  });

  it('swaps the platform-wide unique index for a per-company one', async () => {
    await seedOperator();
    await legacyRow(GmailAccountModel, 'sales@exyconn.test');
    await legacyRow(MicrosoftMailAccountModel, 'ops@exyconn.test');
    jest.spyOn(logger, 'info').mockImplementation(() => logger);

    await assignMailboxesToOperator();

    const names = await Promise.all(MODELS.map(indexNames));
    expect(names).toEqual([
      expect.arrayContaining([PER_COMPANY_INDEX]),
      expect.arrayContaining([PER_COMPANY_INDEX]),
    ]);
    expect(names.flat()).not.toContain(LEGACY_INDEX);
    // Another company may now connect the same address; the same company still may not.
    const other = new Types.ObjectId();
    await expect(
      legacyRow(GmailAccountModel, 'sales@exyconn.test', { organizationId: other }),
    ).resolves.toBeTruthy();
    await expect(
      legacyRow(GmailAccountModel, 'sales@exyconn.test', { organizationId: other }),
    ).rejects.toThrow('E11000');
  });

  it('notes an index already gone, and a rerun changes nothing', async () => {
    const operatorId = await seedOperator();
    await GmailAccountModel.collection.dropIndex(LEGACY_INDEX);
    await legacyRow(GmailAccountModel, 'sales@exyconn.test');
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);

    await assignMailboxesToOperator();
    await assignMailboxesToOperator();

    expect(info).toHaveBeenCalledWith(
      'GmailAccount: moved 1 mailbox(es) into the operator organization; no email_1 left',
    );
    // Only the first run had anything to move.
    expect(info).toHaveBeenCalledTimes(2);
    await expect(ownersOf(GmailAccountModel)).resolves.toEqual([
      ['sales@exyconn.test', operatorId],
    ]);
  });

  it('refuses, changing nothing, while no operator is flagged to receive the mailboxes', async () => {
    await legacyRow(MicrosoftMailAccountModel, 'ops@exyconn.test');

    await expect(assignMailboxesToOperator()).rejects.toThrow(
      'No platform operator organization to move the connected mailboxes into.',
    );

    await expect(ownersOf(MicrosoftMailAccountModel)).resolves.toEqual([
      ['ops@exyconn.test', null],
    ]);
    await expect(indexNames(MicrosoftMailAccountModel)).resolves.toContain(LEGACY_INDEX);
  });
});
