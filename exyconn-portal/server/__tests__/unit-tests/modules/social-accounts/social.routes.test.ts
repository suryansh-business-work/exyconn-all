import { randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { socialCallbackRouter } from '../../../../src/modules/social-accounts';
import { SocialOAuthStateModel } from '../../../../src/modules/social-accounts/social.models';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { useTestOrganization } from '../../../helpers';
import { configureApp } from './social.fixtures';

const ORGANIZATION = useTestOrganization();
const app = express().use('/oauth/social', socialCallbackRouter());

afterEach(() => jest.restoreAllMocks());

/** A connection started from a Marketing page that already carries a query. */
async function started(returnTo = 'https://portal.exyconn.com/marketing/social?tab=accounts') {
  const nonce = randomUUID();
  await runAsPlatform(() =>
    SocialOAuthStateModel.create({
      nonce,
      app: 'LINKEDIN',
      organizationId: ORGANIZATION,
      userId: 'u1',
      codeVerifier: 'v'.repeat(43),
      returnTo,
    }),
  );
  return nonce;
}

describe('the callback, when something is missing', () => {
  it('treats a callback with no code as cancelled, appending to the page’s own query', async () => {
    const nonce = await started();
    const response = await request(app).get(`/oauth/social/linkedin/callback?state=${nonce}`);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      'https://portal.exyconn.com/marketing/social?tab=accounts&error=The+connection+was+cancelled+on+the+provider%E2%80%99s+page.',
    );
  });

  it('treats a repeated code as no code at all', async () => {
    const nonce = await started();
    const response = await request(app).get(
      `/oauth/social/linkedin/callback?state=${nonce}&code=a&code=b`,
    );
    expect(response.headers.location).toContain('error=The+connection+was+cancelled');
  });

  it('refuses a repeated state as no state at all', async () => {
    const response = await request(app).get('/oauth/social/linkedin/callback?state=a&state=b');
    expect(response.status).toBe(400);
    expect(response.text).toBe('This is not a valid social sign-in callback.');
  });

  it('answers in plain words when even the state is unknown', async () => {
    const response = await request(app).get(
      '/oauth/social/linkedin/callback?state=unknown&code=c&error=a&error=b',
    );
    expect(response.status).toBe(400);
    expect(response.text).toMatch('This connection link has expired or was already used');
  });
});

describe('the callback, when the provider cannot be reached', () => {
  it('sends the browser back with a general failure', async () => {
    await configureApp('LINKEDIN');
    const nonce = await started('https://portal.exyconn.com/marketing/social');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue('socket hang up');

    const response = await request(app).get(
      `/oauth/social/linkedin/callback?state=${nonce}&code=c`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      'https://portal.exyconn.com/marketing/social?error=The+connection+failed.',
    );
  });
});
