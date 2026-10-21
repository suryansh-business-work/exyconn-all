import express from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { runForOrganization } from '../../../../src/lib/tenant';
import { AuditLogModel } from '../../../../src/modules/audit';
import { gmailConnectRouter, withParams } from '../../../../src/modules/gmail/gmail.routes';
import { GMAIL_AUDIT_MODULE } from '../../../../src/modules/gmail/gmail.audit';
import {
  GmailAccountModel,
  GmailOAuthStateModel,
} from '../../../../src/modules/gmail/gmail.models';
import { seedOrganization } from '../../../helpers';
import { saveClient } from './fakeGmail';

const app = express().use('/oauth/gmail', gmailConnectRouter());
const RETURN_TO = 'http://localhost:1001/crm/settings';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const idToken = (email: string) =>
  [
    'header',
    Buffer.from(
      JSON.stringify({
        iss: 'accounts.google.com',
        aud: 'client-id',
        exp: Math.floor(Date.now() / 1000) + 600,
        email,
        email_verified: true,
      }),
    ).toString('base64url'),
    'signature',
  ].join('.');

const googleGrants = (email: string) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(json({ refresh_token: 'rt-1', id_token: idToken(email) }));

const callback = (query: Record<string, string>) =>
  request(app).get('/oauth/gmail/callback').query(query);

const redirectParams = (location: string) => new URL(location).searchParams;

beforeEach(async () => {
  await saveClient();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('withParams', () => {
  it('starts a query, or adds to the one already there', () => {
    expect(withParams('https://crm.test/a', { x: '1' })).toBe('https://crm.test/a?x=1');
    expect(withParams('https://crm.test/a?tab=mail', { x: 'a b' })).toBe(
      'https://crm.test/a?tab=mail&x=a+b',
    );
  });
});

describe('the Gmail OAuth callback', () => {
  it('says the connection expired without a state, or with one it does not know', async () => {
    const missing = await callback({ code: 'c' });
    const unknown = await callback({ state: 'never-issued', code: 'c' });

    for (const response of [missing, unknown]) {
      expect(response.status).toBe(400);
      expect(response.text).toContain('This Gmail connection has expired');
    }
  });

  it('connects the mailbox, audits it in the company that started it, and returns', async () => {
    const organization = await seedOrganization();
    const organizationId = organization._id.toHexString();
    await GmailOAuthStateModel.create({
      nonce: 'n1',
      codeVerifier: 'v1',
      returnTo: `${RETURN_TO}?tab=gmail`,
      updatedByName: 'Ravi',
      actorId: 'u1',
      organizationId,
    });
    googleGrants('sales@exyconn.test');

    const response = await callback({ state: 'n1', code: 'code-1' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      `${RETURN_TO}?tab=gmail&gmailConnected=sales%40exyconn.test`,
    );
    // The mailbox belongs to the company that started the connection.
    const owners = await GmailAccountModel.distinct('organizationId', {
      email: 'sales@exyconn.test',
    });
    expect(owners).toEqual([new Types.ObjectId(organizationId)]);
    const audit = await runForOrganization(organizationId, () =>
      AuditLogModel.findOne({ module: GMAIL_AUDIT_MODULE }).lean(),
    );
    expect(audit).toMatchObject({
      action: 'CREATE',
      entityLabel: 'sales@exyconn.test',
      summary: 'Connected the Gmail account sales@exyconn.test',
      actorId: 'u1',
      actorName: 'Ravi',
    });
    // The state is spent: the same callback again has expired.
    expect((await callback({ state: 'n1', code: 'code-1' })).status).toBe(400);
  });

  it('audits an anonymous connection with blank names when the state kept none', async () => {
    const organization = await seedOrganization();
    const organizationId = organization._id.toHexString();
    await GmailOAuthStateModel.collection.insertOne({
      nonce: 'n2',
      codeVerifier: 'v2',
      returnTo: RETURN_TO,
      updatedByName: null,
      actorId: null,
      organizationId,
      createdAt: new Date(),
    });
    googleGrants('ops@exyconn.test');

    const response = await callback({ state: 'n2', code: 'code-2' });

    expect(redirectParams(response.headers.location).get('gmailConnected')).toBe(
      'ops@exyconn.test',
    );
    const audit = await runForOrganization(organizationId, () =>
      AuditLogModel.findOne({ module: GMAIL_AUDIT_MODULE }).lean(),
    );
    expect(audit).toMatchObject({ actorId: '', actorName: '' });
  });

  it('refuses a connection whose state names no company, saving and auditing nothing', async () => {
    await GmailOAuthStateModel.create({ nonce: 'n3', codeVerifier: 'v3', returnTo: RETURN_TO });
    const fetchMock = googleGrants('sales@exyconn.test');

    const response = await callback({ state: 'n3', code: 'code-3' });

    expect(redirectParams(response.headers.location).get('gmailError')).toBe(
      'This Gmail connection was not started from a company. Connect again.',
    );
    // Refused before the code is traded, so Google never hands over a token.
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(GmailAccountModel.countDocuments()).resolves.toBe(0);
    await expect(AuditLogModel.countDocuments({ module: GMAIL_AUDIT_MODULE })).resolves.toBe(0);
  });

  it('returns with the reason when the user cancelled at Google', async () => {
    await GmailOAuthStateModel.create({ nonce: 'n4', codeVerifier: 'v4', returnTo: RETURN_TO });
    const fetchMock = jest.spyOn(globalThis, 'fetch');

    const response = await callback({ state: 'n4' });

    expect(redirectParams(response.headers.location).get('gmailError')).toBe(
      'The Gmail connection was cancelled.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns with Google’s refusal, or a general message when there is none to give', async () => {
    const organizationId = (await seedOrganization())._id.toHexString();
    await GmailOAuthStateModel.create(
      ['n5', 'n6'].map((nonce) => ({
        nonce,
        codeVerifier: `v-${nonce}`,
        returnTo: RETURN_TO,
        organizationId,
      })),
    );
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ error: 'invalid_grant', error_description: 'Bad code' }, 400))
      .mockRejectedValueOnce('socket hang up');

    const refused = await callback({ state: 'n5', code: 'bad' });
    const failed = await callback({ state: 'n6', code: 'code' });

    expect(redirectParams(refused.headers.location).get('gmailError')).toBe(
      'Google refused: invalid_grant Bad code',
    );
    expect(redirectParams(failed.headers.location).get('gmailError')).toBe(
      'The Gmail connection failed.',
    );
    await expect(GmailAccountModel.countDocuments()).resolves.toBe(0);
  });
});
