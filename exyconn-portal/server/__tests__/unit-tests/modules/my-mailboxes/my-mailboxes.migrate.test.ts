import { GmailAccountModel } from '../../../../src/modules/gmail/gmail.models';
import { MicrosoftMailAccountModel } from '../../../../src/modules/microsoft-mail/microsoft.models';
import { allowPersonalMailboxes } from '../../../../src/modules/my-mailboxes';
import { logger } from '../../../../src/utils/logger';

const MODELS = [GmailAccountModel, MicrosoftMailAccountModel] as const;
const COMPANY_INDEX = 'organizationId_1_email_1';
const OWNER_INDEX = 'organizationId_1_email_1_ownerUserId_1';

const indexNames = async (model: (typeof MODELS)[number]) =>
  (await model.collection.indexes()).map((index) => index.name);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('allowPersonalMailboxes', () => {
  it('builds the per-owner index, then drops the per-company one', async () => {
    await Promise.all(
      MODELS.map((model) =>
        model.collection.createIndex(
          { organizationId: 1, email: 1 },
          { unique: true, name: COMPANY_INDEX },
        ),
      ),
    );
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);

    await allowPersonalMailboxes();

    for (const names of await Promise.all(MODELS.map(indexNames))) {
      expect(names).toContain(OWNER_INDEX);
      expect(names).not.toContain(COMPANY_INDEX);
    }
    expect(info).toHaveBeenCalledWith(
      `GmailAccount: dropped ${COMPANY_INDEX}; personal mailboxes may share it`,
    );
  });

  it('changes nothing on a database that never had the old index', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);

    await allowPersonalMailboxes();

    expect(await indexNames(GmailAccountModel)).toContain(OWNER_INDEX);
    expect(info).not.toHaveBeenCalled();
  });
});
