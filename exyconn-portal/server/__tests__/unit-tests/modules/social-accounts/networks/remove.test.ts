import { NETWORKS } from '../../../../../src/modules/social-accounts/networks';
import { SocialProviderError } from '../../../../../src/modules/social-accounts/social.http';
import { fakeFetch } from '../social.fixtures';

const ACCOUNT = { externalId: 'acct-1', accessToken: 'the-token' };

afterEach(() => jest.restoreAllMocks());

describe('deleting a published post on its network', () => {
  it('deletes a Facebook post with the page token in the query', async () => {
    const calls = fakeFetch([
      [/graph\.facebook\.com\/v19\.0\/fb-post-1\?/, 200, { success: true }],
    ]);
    await NETWORKS.FACEBOOK.remove?.(ACCOUNT, 'fb-post-1');
    expect(calls[0].method).toBe('DELETE');
    expect(new URL(calls[0].url).searchParams.get('access_token')).toBe('the-token');
  });

  it('deletes a tweet', async () => {
    const calls = fakeFetch([[/api\.x\.com\/2\/tweets\/t-1$/, 200, { data: { deleted: true } }]]);
    await NETWORKS.X.remove?.(ACCOUNT, 't-1');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].headers.Authorization).toBe('Bearer the-token');
  });

  it('deletes a Threads post', async () => {
    const calls = fakeFetch([[/graph\.threads\.net\/v1\.0\/th-1\?/, 200, { success: true }]]);
    await NETWORKS.THREADS.remove?.(ACCOUNT, 'th-1');
    expect(calls[0].method).toBe('DELETE');
    expect(new URL(calls[0].url).searchParams.get('access_token')).toBe('the-token');
  });

  it('deletes a YouTube video', async () => {
    const calls = fakeFetch([[/youtube\/v3\/videos\?id=vid-1$/, 204, undefined]]);
    await NETWORKS.YOUTUBE.remove?.(ACCOUNT, 'vid-1');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].headers.Authorization).toBe('Bearer the-token');
  });

  it('has no delete for Instagram, which does not let apps delete media', () => {
    expect(NETWORKS.INSTAGRAM.remove).toBeNull();
  });

  it("passes on the network's refusal with its status", async () => {
    fakeFetch([[/api\.x\.com\/2\/tweets\/t-404$/, 404, { detail: 'Not Found' }]]);
    const refusal = await NETWORKS.X.remove?.(ACCOUNT, 't-404').catch((error: unknown) => error);
    expect(refusal).toBeInstanceOf(SocialProviderError);
    expect((refusal as SocialProviderError).status).toBe(404);
  });
});
