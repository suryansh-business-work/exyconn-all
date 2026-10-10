import { publishDuePosts } from '../../../../src/modules/social-accounts/social.publish';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import { useTestOrganization } from '../../../helpers';
import { HOUR, composedPost, connectAccount, fakeFetch } from './social.fixtures';

useTestOrganization();

afterEach(() => jest.restoreAllMocks());

describe('publishing what is due, as the scheduler calls it', () => {
  it('reads "now" from the clock when no moment is given', async () => {
    const account = await connectAccount('X', 'X');
    const accountId = account._id.toHexString();
    const due = await composedPost(accountId, {
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() - HOUR),
    });
    const later = await composedPost(accountId, {
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + HOUR),
    });
    const calls = fakeFetch([[/api\.x\.com\/2\/tweets/, 201, { data: { id: 't-1' } }]]);

    await expect(publishDuePosts()).resolves.toBe(1);

    expect(calls).toHaveLength(1);
    expect(await SocialMediaPostModel.findById(due._id).lean()).toMatchObject({
      status: 'PUBLISHED',
      externalId: 't-1',
    });
    expect(await SocialMediaPostModel.findById(later._id).lean()).toMatchObject({
      status: 'SCHEDULED',
    });
  });
});
