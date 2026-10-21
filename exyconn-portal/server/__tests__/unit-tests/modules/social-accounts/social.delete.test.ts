import { Types } from 'mongoose';
import { deletePublishedPost } from '../../../../src/modules/social-accounts/social.delete';
import { socialPostsResolvers } from '../../../../src/modules/social-accounts';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { SocialApp } from '../../../../src/modules/social-accounts/social.constants';
import { composedPost, connectAccount, ctxOf, fakeFetch, type Resolver } from './social.fixtures';

const ORGANIZATION = useTestOrganization();
const ctx = () => ctxOf([ROLES.MARKETING], ORGANIZATION);
const Q = socialPostsResolvers.Query as unknown as Record<string, Resolver>;
const M = socialPostsResolvers.Mutation as unknown as Record<string, Resolver>;

afterEach(() => jest.restoreAllMocks());

/** A post that went out on an account, with the network's id for it. */
async function published(network: string, app: SocialApp, over: Record<string, unknown> = {}) {
  const account = await connectAccount(network, app, { externalId: `${network}-acct` });
  return composedPost(account._id.toHexString(), {
    network,
    app,
    status: 'PUBLISHED',
    externalId: `${network.toLowerCase()}-post`,
    publishedAt: new Date(),
    ...over,
  });
}

describe('deleting a published post', () => {
  it('deletes it on the network and here, and logs it', async () => {
    const post = await published('X', 'X');
    const calls = fakeFetch([[/2\/tweets\/x-post$/, 200, { data: { deleted: true } }]]);

    const [result] = await deletePublishedPost(post._id.toHexString(), ctx());

    expect(result).toMatchObject({ outcome: 'DELETED', message: 'Deleted from X and Exyconn.' });
    expect(calls[0].method).toBe('DELETE');
    expect(await SocialMediaPostModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.findOne({ module: 'SocialPost' }).lean()).toMatchObject({
      action: 'DELETE',
      entityId: post._id.toHexString(),
    });
  });

  it('treats a post the network no longer has as deleted', async () => {
    const post = await published('FACEBOOK', 'META');
    fakeFetch([[/facebook-post\?/, 404, { error: { message: 'Unsupported delete request' } }]]);

    const [result] = await deletePublishedPost(post._id.toHexString(), ctx());

    expect(result.outcome).toBe('DELETED');
    expect(await SocialMediaPostModel.countDocuments()).toBe(0);
  });

  it("keeps the post here, unlogged, with the network's reason when it refuses", async () => {
    const post = await published('X', 'X');
    fakeFetch([[/2\/tweets\/x-post$/, 403, { detail: 'You are not allowed to delete this' }]]);

    const [result] = await deletePublishedPost(post._id.toHexString(), ctx());

    expect(result).toMatchObject({ outcome: 'FAILED' });
    expect(result.message).toMatch('You are not allowed to delete this');
    expect((await SocialMediaPostModel.findById(post._id).lean())?.status).toBe('PUBLISHED');
    expect(await AuditLogModel.countDocuments({ module: 'SocialPost' })).toBe(0);
  });

  it('removes an Instagram post here only, saying it stays on Instagram, and lists it no more', async () => {
    const post = await published('INSTAGRAM', 'META');
    const calls = fakeFetch([]);

    const [result] = await deletePublishedPost(post._id.toHexString(), ctx());

    expect(result).toMatchObject({
      outcome: 'KEPT_ON_NETWORK',
      message:
        "Removed from Exyconn. Instagram doesn't let apps delete posts. Delete it in the Instagram app.",
    });
    expect(calls).toHaveLength(0);
    // Kept, so a sync does not bring it back — but never listed again.
    expect((await SocialMediaPostModel.findById(post._id).lean())?.status).toBe('REMOVED');
    expect(await Q.socialMediaPosts(null, { limit: 10 }, ctx())).toEqual([]);
    const range = {
      from: new Date(Date.now() - 86_400_000),
      to: new Date(Date.now() + 86_400_000),
    };
    expect(await Q.socialCalendar(null, range, ctx())).toEqual([]);
  });

  it('deletes every account of a post written together, one refusal not stopping the rest', async () => {
    const x = await published('X', 'X', { batchId: 'b1' });
    const fb = await published('FACEBOOK', 'META', { batchId: 'b1' });
    await published('THREADS', 'THREADS', { batchId: 'b1', status: 'FAILED', externalId: null });
    fakeFetch([
      [/2\/tweets\/x-post$/, 500, { detail: 'X is over capacity' }],
      [/facebook-post\?/, 200, { success: true }],
    ]);

    const results = await deletePublishedPost(x._id.toHexString(), ctx());

    const outcomes = Object.fromEntries(results.map((r) => [r.network, r.outcome]));
    expect(outcomes).toEqual({ X: 'FAILED', FACEBOOK: 'DELETED' });
    expect(await SocialMediaPostModel.findById(fb._id).lean()).toBeNull();
    expect(await SocialMediaPostModel.countDocuments()).toBe(2);
  });

  it('cannot delete on the network once the account is disconnected', async () => {
    const post = await composedPost(new Types.ObjectId().toHexString(), {
      status: 'PUBLISHED',
      externalId: 'x-post',
    });

    const [result] = await deletePublishedPost(post._id.toHexString(), ctx());

    expect(result).toMatchObject({ outcome: 'FAILED' });
    expect(result.message).toMatch('no longer connected');
  });

  it('deletes here a published post the network never gave an id', async () => {
    const post = await published('X', 'X', { externalId: null });
    const calls = fakeFetch([]);

    expect((await deletePublishedPost(post._id.toHexString(), ctx()))[0].outcome).toBe('DELETED');
    expect(calls).toHaveLength(0);
  });

  it('leaves drafts and scheduled posts to the existing delete', async () => {
    const account = await connectAccount('X', 'X');
    const draft = await composedPost(account._id.toHexString());
    expect(await codeOf(deletePublishedPost(draft._id.toHexString(), ctx()))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await codeOf(deletePublishedPost(new Types.ObjectId().toHexString(), ctx()))).toBe(
      'NOT_FOUND',
    );
  });

  it('is for Marketing, through the resolver', async () => {
    const post = await published('X', 'X');
    fakeFetch([[/2\/tweets\/x-post$/, 200, { data: { deleted: true } }]]);

    expect(
      await codeOf(
        Promise.resolve().then(() =>
          M.deletePublishedSocialPost(
            null,
            { id: post._id.toHexString() },
            ctxOf([ROLES.EMPLOYEE]),
          ),
        ),
      ),
    ).toBe('FORBIDDEN');
    const results = (await M.deletePublishedSocialPost(
      null,
      { id: post._id.toHexString() },
      ctx(),
    )) as { outcome: string }[];
    expect(results.map((r) => r.outcome)).toEqual(['DELETED']);
  });
});

describe('network rules', () => {
  it('say which networks let a published post be deleted from here', () => {
    const resolve = (
      socialPostsResolvers as unknown as {
        SocialNetworkRule: { canDelete: (rule: { network: string }) => boolean };
      }
    ).SocialNetworkRule.canDelete;
    expect(resolve({ network: 'INSTAGRAM' })).toBe(false);
    expect(resolve({ network: 'LINKEDIN' })).toBe(true);
  });
});
