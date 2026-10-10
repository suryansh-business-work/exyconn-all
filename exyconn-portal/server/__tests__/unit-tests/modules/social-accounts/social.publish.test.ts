import { Types } from 'mongoose';
import {
  deliver,
  deletePost,
  publishNow,
  updatePost,
} from '../../../../src/modules/social-accounts/social.publish';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { HOUR, composedPost, connectAccount } from './social.fixtures';
import { asArg } from '../../../mockAs';

useTestOrganization();

afterEach(() => jest.restoreAllMocks());

const draft = (over: Record<string, unknown> = {}) => ({
  text: 'Hello',
  mediaUrl: '',
  link: '',
  ...over,
});

describe('delivering', () => {
  it('does nothing for a post that is no longer there', async () => {
    const fetched = jest.spyOn(globalThis, 'fetch');
    await expect(deliver(new Types.ObjectId().toHexString())).resolves.toBeUndefined();
    expect(fetched).not.toHaveBeenCalled();
  });

  it('records a failure the network gave as something other than an Error', async () => {
    const account = await connectAccount('X', 'X');
    const post = await composedPost(account._id.toHexString());
    jest.spyOn(globalThis, 'fetch').mockRejectedValue('socket hang up');

    expect(await publishNow(post._id.toHexString())).toMatchObject({
      status: 'FAILED',
      error: 'socket hang up',
    });
  });
});

describe('what can be changed', () => {
  it('refuses to change or remove a post that was read from the network', async () => {
    const account = await connectAccount('X', 'X');
    const synced = await composedPost(account._id.toHexString(), {
      origin: 'SYNCED',
      status: 'PUBLISHED',
      externalId: 'tweet-1',
    });
    const id = synced._id.toHexString();
    await expect(updatePost(id, draft())).rejects.toThrow('Only a draft, scheduled or failed post');
    await expect(publishNow(id)).rejects.toThrow('Only a draft, scheduled or failed post');
    await expect(deletePost(id)).rejects.toThrow('Only a draft, scheduled or failed post');
    expect(await SocialMediaPostModel.countDocuments()).toBe(1);
  });

  it('says not found when publishing a post that does not exist', async () => {
    expect(await codeOf(publishNow(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
    expect(await codeOf(deletePost(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
  });
});

describe('editing', () => {
  it('keeps a draft a draft when it is edited without a time', async () => {
    const account = await connectAccount('X', 'X');
    const post = await composedPost(account._id.toHexString());
    expect(await updatePost(post._id.toHexString(), draft({ text: '  Edited  ' }))).toMatchObject({
      text: 'Edited',
      status: 'DRAFT',
      scheduledAt: null,
    });
  });

  it('keeps a failed post failed, clearing the old error, until it is retried', async () => {
    const account = await connectAccount('X', 'X');
    const post = await composedPost(account._id.toHexString(), {
      status: 'FAILED',
      error: 'X refused the connection: rate limited',
    });
    expect(
      await updatePost(post._id.toHexString(), draft({ link: ' https://e.com ' })),
    ).toMatchObject({
      status: 'FAILED',
      error: '',
      link: 'https://e.com',
    });
  });

  it('moves a failed post back onto the schedule', async () => {
    const account = await connectAccount('X', 'X');
    const post = await composedPost(account._id.toHexString(), { status: 'FAILED' });
    const later = new Date(Date.now() + HOUR);
    expect(
      await updatePost(post._id.toHexString(), { ...draft(), scheduledAt: later }),
    ).toMatchObject({
      status: 'SCHEDULED',
      scheduledAt: later,
    });
  });

  it('says not found when the post disappears between the check and the write', async () => {
    const account = await connectAccount('X', 'X');
    const post = await composedPost(account._id.toHexString());
    jest
      .spyOn(SocialMediaPostModel, 'findByIdAndUpdate')
      .mockReturnValueOnce(asArg({ lean: async () => null }));
    expect(await codeOf(updatePost(post._id.toHexString(), draft()))).toBe('NOT_FOUND');
  });
});

describe('publishing now', () => {
  it('says not found when the post is removed while it is going out', async () => {
    const account = await connectAccount('X', 'X');
    const post = await composedPost(account._id.toHexString());
    jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      await SocialMediaPostModel.deleteOne({ _id: post._id });
      return new Response(JSON.stringify({ data: { id: 't1' } }), { status: 201 });
    });
    expect(await codeOf(publishNow(post._id.toHexString()))).toBe('NOT_FOUND');
  });
});
