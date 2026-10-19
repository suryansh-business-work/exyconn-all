import express from 'express';
import request from 'supertest';
import { googleSignInRouter } from '../../../../../src/modules/auth/google/google-sign-in.routes';
import * as flow from '../../../../../src/modules/auth/google/google-sign-in.flow';
import {
  GoogleSignInStateModel,
  GoogleSignInTicketModel,
} from '../../../../../src/modules/auth/google/google-sign-in.models';
import { sha256 } from '../../../../../src/modules/auth/google/google-sign-in.oauth';
import { env } from '../../../../../src/config/env';
import { ROLES } from '../../../../../src/constants/roles';
import { logger } from '../../../../../src/utils/logger';
import { seedUser } from '../../../../helpers';
import { credential, googleAnswersFor, storeGoogleClient } from './googleSignIn.fixtures';

const app = express().use('/oauth/google', googleSignInRouter());
const PORTAL = `${env.corsOrigins[0]}/sign-in`;
const EXPIRED = 'This Google sign-in has expired. Go back to the portal and try again.';

const startedAt = (returnTo = PORTAL) =>
  GoogleSignInStateModel.create({ nonce: 'nonce-1', codeVerifier: 'verifier-1', returnTo });

/** The query parameters of the portal page the callback redirected to. */
const paramsOf = (location: string) => Object.fromEntries(new URL(location).searchParams);

beforeEach(() => {
  jest.spyOn(logger, 'warn').mockImplementation(() => logger);
});
afterEach(() => jest.restoreAllMocks());

describe('GET /oauth/google/callback', () => {
  it('sends the person back with a ticket for their account', async () => {
    await storeGoogleClient();
    const user = await seedUser('meera@exyconn.com', credential('pw'), [ROLES.EMPLOYEE]);
    googleAnswersFor('meera@exyconn.com');
    await startedAt();

    const res = await request(app).get('/oauth/google/callback?state=nonce-1&code=code-1');

    expect(res.status).toBe(302);
    expect(res.headers.location.startsWith(`${PORTAL}?googleTicket=`)).toBe(true);
    const { googleTicket } = paramsOf(res.headers.location);
    const stored = await GoogleSignInTicketModel.findOne({ ticketHash: sha256(googleTicket) });
    expect(stored?.userId).toBe(user.id);
    expect(await GoogleSignInStateModel.countDocuments()).toBe(0);
  });

  it('adds to a return page that already has a query, with the reason it failed', async () => {
    await storeGoogleClient();
    googleAnswersFor('stranger@exyconn.com');
    await startedAt(`${PORTAL}?next=%2Fhr`);

    const res = await request(app).get('/oauth/google/callback?state=nonce-1&code=code-1');

    expect(res.status).toBe(302);
    expect(res.headers.location.startsWith(`${PORTAL}?next=%2Fhr&googleError=`)).toBe(true);
    expect(paramsOf(res.headers.location)).toEqual({
      next: '/hr',
      googleError:
        'No active portal account uses stranger@exyconn.com. Ask an administrator to invite it.',
    });
    expect(logger.warn).toHaveBeenCalledWith(expect.anything(), 'Google sign-in failed');
  });

  it.each(['state=nonce-1', 'state=nonce-1&code=a&code=b'])(
    'says the sign-in was cancelled when Google sends no code (%s)',
    async (query) => {
      await startedAt();
      const res = await request(app).get(`/oauth/google/callback?${query}`);
      expect(paramsOf(res.headers.location)).toEqual({
        googleError: 'Google sign-in was cancelled.',
      });
    },
  );

  it('falls back to a generic reason for a failure that is not an Error', async () => {
    await startedAt();
    jest.spyOn(flow, 'finishGoogleSignIn').mockRejectedValue('boom');
    const res = await request(app).get('/oauth/google/callback?state=nonce-1&code=c');
    expect(paramsOf(res.headers.location)).toEqual({ googleError: 'Google sign-in failed.' });
  });

  it.each(['', '?code=c', '?state=unknown&code=c', '?state=a&state=b&code=c'])(
    'refuses a callback without a live state (%s)',
    async (query) => {
      await startedAt();
      const res = await request(app).get(`/oauth/google/callback${query}`);
      expect(res.status).toBe(400);
      expect(res.text).toBe(EXPIRED);
    },
  );

  it('accepts each state only once', async () => {
    await startedAt();
    await request(app).get('/oauth/google/callback?state=nonce-1');
    const again = await request(app).get('/oauth/google/callback?state=nonce-1&code=c');
    expect(again.status).toBe(400);
  });
});
