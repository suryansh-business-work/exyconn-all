import { syncAccount, syncAllAccounts } from '../../../../src/modules/social-accounts/social.sync';
import { SocialAccountModel } from '../../../../src/modules/social-accounts/social.models';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';
import { connectAccount, fakeFetch } from './social.fixtures';

useTestOrganization();

afterEach(() => jest.restoreAllMocks());

describe('syncing every account', () => {
  it('warns about nothing when every account synced', async () => {
    const li = await connectAccount('LINKEDIN', 'LINKEDIN');
    const ig = await connectAccount('INSTAGRAM', 'META');
    fakeFetch([
      [
        /instagram-1\/media\?/,
        200,
        {
          data: [{ id: 'm1', caption: 'Hi', timestamp: '2026-09-18T10:00:00+0000', like_count: 2 }],
        },
      ],
    ]);
    const warn = jest.spyOn(logger, 'warn');

    const results = await syncAllAccounts();

    expect(results).toEqual(
      expect.arrayContaining([
        { accountId: li._id.toHexString(), synced: 0, error: '' },
        { accountId: ig._id.toHexString(), synced: 1, error: '' },
      ]),
    );
    expect(warn).not.toHaveBeenCalled();
    expect(await SocialMediaPostModel.findOne({ externalId: 'm1' }).lean()).toMatchObject({
      origin: 'SYNCED',
      status: 'PUBLISHED',
      network: 'INSTAGRAM',
      text: 'Hi',
      metrics: { likes: 2 },
    });
    const stored = await SocialAccountModel.findById(li._id).lean();
    expect(stored?.lastSyncedAt).toBeInstanceOf(Date);
  });

  it('returns nothing for a company with no accounts', async () => {
    expect(await syncAllAccounts()).toEqual([]);
  });
});

describe('syncing one account', () => {
  it('records a failure the network gave as something other than an Error', async () => {
    const xAcc = await connectAccount('X', 'X', { syncError: 'old reason' });
    jest.spyOn(globalThis, 'fetch').mockRejectedValue('connection reset');

    expect(await syncAccount(xAcc._id.toHexString())).toEqual({
      accountId: xAcc._id.toHexString(),
      synced: 0,
      error: 'connection reset',
    });
    expect((await SocialAccountModel.findById(xAcc._id).lean())?.syncError).toBe(
      'connection reset',
    );
  });

  it('clears an old failure once a sync works again', async () => {
    const fb = await connectAccount('FACEBOOK', 'META', { syncError: 'old reason' });
    fakeFetch([[/facebook-1\/posts/, 200, { data: [] }]]);
    expect(await syncAccount(fb._id.toHexString())).toMatchObject({ synced: 0, error: '' });
    expect((await SocialAccountModel.findById(fb._id).lean())?.syncError).toBe('');
  });
});
