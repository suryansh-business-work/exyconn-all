import { Types } from 'mongoose';
import {
  disconnect,
  idleAccountIds,
  listAccounts,
  setAccountActive,
} from '../../../../src/modules/social-accounts/social.accounts';
import { SocialAccountModel } from '../../../../src/modules/social-accounts/social.models';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import {
  HELD_NOTE,
  composePosts,
  deliver,
  publishDuePosts,
  publishNow,
} from '../../../../src/modules/social-accounts/social.publish';
import { syncAccount, syncAllAccounts } from '../../../../src/modules/social-accounts/social.sync';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { HOUR, composedPost, configureApp, connectAccount, fakeFetch } from './social.fixtures';

useTestOrganization();

afterEach(() => jest.restoreAllMocks());

const draft = { text: 'Hello', mediaUrl: '', link: '' };

describe('listing accounts', () => {
  it('reads rows from before pages and pausing as an active person', async () => {
    await SocialAccountModel.collection.insertOne({
      network: 'X',
      app: 'X',
      externalId: 'old-1',
      name: 'Old',
      accessToken: 'sealed',
      connectedBy: 'u1',
      organizationId: (await connectAccount('X', 'X')).get('organizationId'),
    });

    const old = (await listAccounts()).find((row) => row.name === 'Old');

    expect(old).toMatchObject({ kind: 'PERSON', active: true, needsReconnect: false });
    expect(old).not.toHaveProperty('accessToken');
  });

  it('asks a LinkedIn member without the page scopes to reconnect, but not a page', async () => {
    await connectAccount('LINKEDIN', 'LINKEDIN', { externalId: 'm-old', name: 'Before' });
    await connectAccount('LINKEDIN', 'LINKEDIN', {
      externalId: 'm-new',
      name: 'After',
      scopes: ['openid', 'r_organization_admin'],
    });
    await connectAccount('LINKEDIN', 'LINKEDIN', {
      externalId: '42',
      name: 'Page',
      kind: 'ORGANIZATION',
    });

    const byName = Object.fromEntries((await listAccounts()).map((row) => [row.name, row]));

    expect(byName.Before.needsReconnect).toBe(true);
    expect(byName.After.needsReconnect).toBe(false);
    expect(byName.Page.needsReconnect).toBe(false);
  });

  it('asks no one to reconnect once LinkedIn refused the page scopes for the app', async () => {
    await configureApp('LINKEDIN', { pagesRefused: true });
    await connectAccount('LINKEDIN', 'LINKEDIN', { name: 'Before' });

    expect((await listAccounts())[0].needsReconnect).toBe(false);
  });
});

describe('pausing an account', () => {
  it('pauses and resumes, clearing the held note on its scheduled posts', async () => {
    const account = await connectAccount('X', 'X');
    const id = account._id.toHexString();
    await composedPost(id, { status: 'SCHEDULED', error: HELD_NOTE });

    expect(await setAccountActive(id, false)).toMatchObject({ active: false, name: 'X' });
    expect(await idleAccountIds()).toEqual([id]);

    expect((await setAccountActive(id, true)).active).toBe(true);
    expect((await SocialMediaPostModel.findOne({ accountId: id }).lean())?.error).toBe('');
    expect(await idleAccountIds()).toEqual([]);
  });

  it('says not found for an account that is not there', async () => {
    expect(await codeOf(setAccountActive(new Types.ObjectId().toHexString(), false))).toBe(
      'NOT_FOUND',
    );
  });

  it('holds a due scheduled post to a paused account, and sends the others', async () => {
    const paused = await connectAccount('X', 'X', { active: false });
    const live = await connectAccount('X', 'X', { externalId: 'x-2' });
    const held = await composedPost(paused._id.toHexString(), {
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() - HOUR),
    });
    const sent = await composedPost(live._id.toHexString(), {
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() - HOUR),
    });
    fakeFetch([[/api\.x\.com\/2\/tweets$/, 201, { data: { id: 't1' } }]]);

    expect(await publishDuePosts()).toBe(1);

    expect(await SocialMediaPostModel.findById(held._id).lean()).toMatchObject({
      status: 'SCHEDULED',
      error: HELD_NOTE,
    });
    expect((await SocialMediaPostModel.findById(sent._id).lean())?.status).toBe('PUBLISHED');
  });

  it('holds rather than fails a post claimed just before its account was paused', async () => {
    const account = await connectAccount('X', 'X', { active: false });
    const post = await composedPost(account._id.toHexString(), { status: 'PUBLISHING' });
    await deliver(post._id.toHexString());

    expect(await SocialMediaPostModel.findById(post._id).lean()).toMatchObject({
      status: 'SCHEDULED',
      error: HELD_NOTE,
    });
  });

  it('refuses to compose for, or publish now to, a paused or unreachable account', async () => {
    const paused = await connectAccount('X', 'X', { active: false, name: 'Quiet' });
    const gone = await connectAccount('X', 'X', {
      externalId: 'x-gone',
      name: 'Gone',
      disconnectedAt: new Date(),
    });

    await expect(
      composePosts({ ...draft, accountIds: [paused._id.toHexString()] }, 'u1'),
    ).rejects.toThrow('Quiet is paused');
    await expect(
      composePosts({ ...draft, accountIds: [gone._id.toHexString()] }, 'u1'),
    ).rejects.toThrow('Gone is no longer reachable');
    const draftPost = await composedPost(paused._id.toHexString());
    await expect(publishNow(draftPost._id.toHexString())).rejects.toThrow('Quiet is paused');
  });

  it('leaves paused and unreachable accounts out of "Sync all", and says so for one', async () => {
    const paused = await connectAccount('X', 'X', { active: false, name: 'Quiet' });
    await connectAccount('X', 'X', {
      externalId: 'x-gone',
      name: 'Gone',
      disconnectedAt: new Date(),
    });
    const calls = fakeFetch([]);

    expect(await syncAllAccounts()).toEqual([]);
    expect(calls).toHaveLength(0);
    expect((await syncAccount(paused._id.toHexString())).error).toBe(
      'Quiet is paused. Turn it back on to sync it.',
    );
  });

  it('says an unreachable page cannot be synced', async () => {
    const gone = await connectAccount('X', 'X', { name: 'Gone', disconnectedAt: new Date() });
    expect((await syncAccount(gone._id.toHexString())).error).toMatch('no longer reachable');
  });
});

describe('disconnecting', () => {
  it('takes the pages that post through a LinkedIn member with it', async () => {
    const person = await connectAccount('LINKEDIN', 'LINKEDIN', { name: 'Asha' });
    await connectAccount('LINKEDIN', 'LINKEDIN', {
      externalId: '42',
      name: 'Exyconn',
      kind: 'ORGANIZATION',
      tokenAccountId: person._id.toHexString(),
    });
    await connectAccount('X', 'X');

    const removed = await disconnect(person._id.toHexString());

    expect(removed).toMatchObject({ account: { name: 'Asha' }, pages: ['Exyconn'] });
    expect(await SocialAccountModel.find().distinct('network')).toEqual(['X']);
  });
});
