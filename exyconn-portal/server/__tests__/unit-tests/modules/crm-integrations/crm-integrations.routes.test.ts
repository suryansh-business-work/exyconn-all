import express from 'express';
import request from 'supertest';
import { crmIntegrationsVobizRouter } from '../../../../src/modules/crm-integrations';
import { dialXml } from '../../../../src/modules/crm-integrations/crm-integrations.call';
import { CrmCallSessionModel } from '../../../../src/modules/crm-integrations/crm-integrations.models';

const HANG_UP = '<Response><Hangup/></Response>';
const app = express().use('/answer', crmIntegrationsVobizRouter());

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Vobiz answer callback for a CRM call', () => {
  it('bridges the waiting session once, then hangs up on a replay', async () => {
    await CrmCallSessionModel.create({
      token: 'tok-1',
      dial: '919876543210',
      callerId: '14155550100',
    });

    const first = await request(app).post('/answer/tok-1');
    expect(first.status).toBe(200);
    expect(first.type).toBe('application/xml');
    expect(first.text).toBe(dialXml('14155550100', '919876543210'));

    const replay = await request(app).post('/answer/tok-1');
    expect(replay.text).toBe(HANG_UP);
    expect(await CrmCallSessionModel.countDocuments()).toBe(0);
  });

  it('hangs up on a token that names no session', async () => {
    const response = await request(app).post('/answer/guessed');
    expect(response.text).toBe(HANG_UP);
  });

  it('hangs up when the session cannot be read', async () => {
    jest.spyOn(CrmCallSessionModel, 'findOneAndDelete').mockImplementation(() => {
      throw new Error('database down');
    });

    const response = await request(app).post('/answer/tok-2');
    expect(response.status).toBe(200);
    expect(response.text).toBe(HANG_UP);
  });
});
