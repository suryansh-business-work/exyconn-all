import express from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { env } from '../../../../src/config/env';
import { runForOrganization } from '../../../../src/lib/tenant';
import { AuditLogModel } from '../../../../src/modules/audit';
import {
  MicrosoftMailAccountModel,
  MicrosoftOAuthStateModel,
} from '../../../../src/modules/microsoft-mail/microsoft.models';
import { microsoftConnectRouter } from '../../../../src/modules/microsoft-mail/microsoft.routes';
import { logger } from '../../../../src/utils/logger';
import { fakeMicrosoft, saveApp } from './fakeMicrosoft';

const SALES = 'sales@contoso.test';
const PORTAL = `${env.corsOrigins[0]}/crm/integrations`;
const app = express().use('/oauth/microsoft', microsoftConnectRouter());
const callback = (query: string) => request(app).get(`/oauth/microsoft/callback?${query}`);
const redirectParams = (location: string) => Object.fromEntries(new URL(location).searchParams);

/** A connection in progress, as "Connect Microsoft" leaves it. */
const pending = (fields: Record<string, unknown> = {}) =>
  MicrosoftOAuthStateModel.create({
    nonce: 'nonce-1',
    codeVerifier: 'verifier-1',
    returnTo: PORTAL,
    actorId: 'u1',
    actorName: 'Ravi',
    organizationId: new Types.ObjectId().toHexString(),
    ...fields,
  });
const auditIn = (organizationId: string) =>
  runForOrganization(organizationId, () => AuditLogModel.find().lean());

beforeEach(async () => {
  await saveApp();
  jest.spyOn(logger, 'warn').mockImplementation(() => logger);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the Microsoft connect callback', () => {
  it.each([
    ['no state', 'code=c'],
    ['a repeated state', 'state=a&state=b&code=c'],
    ['an unknown state', 'state=nonce-unknown&code=c'],
  ])('says the connection expired for %s', async (_case, query) => {
    const response = await callback(query);

    expect(response.status).toBe(400);
    expect(response.text).toBe('This Microsoft connection has expired. Go back and connect again.');
  });

  it('connects the mailbox, goes back to the portal and audits it in the company that asked', async () => {
    const organizationId = new Types.ObjectId().toHexString();
    await pending({ organizationId, returnTo: `${PORTAL}?tab=mail` });
    fakeMicrosoft({ [SALES]: {} });

    const response = await callback(`state=nonce-1&code=code-${SALES}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      `${PORTAL}?tab=mail&${new URLSearchParams({ microsoftConnected: SALES }).toString()}`,
    );
    expect(await MicrosoftMailAccountModel.countDocuments({ email: SALES })).toBe(1);
    expect(await MicrosoftOAuthStateModel.countDocuments()).toBe(0);
    const audit = await auditIn(organizationId);
    expect(audit).toEqual([
      expect.objectContaining({
        action: 'CREATE',
        module: 'CrmMicrosoftMail',
        entityLabel: SALES,
        summary: `Connected the Microsoft mailbox ${SALES}`,
        actorId: 'u1',
        actorName: 'Ravi',
      }),
    ]);
  });

  it('names nobody for a state saved before it carried the actor', async () => {
    const organizationId = new Types.ObjectId().toHexString();
    await MicrosoftOAuthStateModel.collection.insertOne({
      nonce: 'nonce-1',
      codeVerifier: 'verifier-1',
      returnTo: PORTAL,
      organizationId,
      createdAt: new Date(),
    });
    fakeMicrosoft({ [SALES]: {} });

    const response = await callback(`state=nonce-1&code=code-${SALES}`);

    expect(redirectParams(response.headers.location)).toEqual({ microsoftConnected: SALES });
    const audit = await auditIn(organizationId);
    expect(audit[0]).toMatchObject({ actorId: '', actorName: '' });
  });

  it('refuses a connection that named no company, saving and auditing nothing', async () => {
    await pending({ organizationId: '' });
    const microsoft = fakeMicrosoft({ [SALES]: {} });

    const response = await callback(`state=nonce-1&code=code-${SALES}`);

    expect(redirectParams(response.headers.location)).toEqual({
      microsoftError: 'This Microsoft connection was not started from a company. Connect again.',
    });
    expect(microsoft.tokens).toHaveLength(0);
    expect(await MicrosoftMailAccountModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('goes back with the reason when the person cancelled on Microsoft', async () => {
    await pending();

    const response = await callback('state=nonce-1&error=access_denied');

    expect(redirectParams(response.headers.location)).toEqual({
      microsoftError: 'The Microsoft connection was cancelled.',
    });
    expect(await MicrosoftOAuthStateModel.countDocuments()).toBe(0);
  });

  it("goes back with Microsoft's refusal", async () => {
    await pending();
    fakeMicrosoft({ [SALES]: { revoked: true } });

    const response = await callback(`state=nonce-1&code=code-${SALES}`);

    expect(redirectParams(response.headers.location)).toEqual({
      microsoftError: 'Microsoft refused the stored connection. Connect it again.',
    });
    expect(await MicrosoftMailAccountModel.countDocuments()).toBe(0);
  });

  it('goes back with a general failure when Microsoft never answered', async () => {
    await pending();
    jest.spyOn(globalThis, 'fetch').mockRejectedValue({ code: 'ECONNRESET' });

    const response = await callback(`state=nonce-1&code=code-${SALES}`);

    expect(redirectParams(response.headers.location)).toEqual({
      microsoftError: 'The Microsoft connection failed.',
    });
  });
});
