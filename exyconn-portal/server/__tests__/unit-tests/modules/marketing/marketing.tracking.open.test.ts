import request from 'supertest';
import { PIXEL } from '../../../../src/modules/marketing/marketing.tracking';
import { CampaignSendModel } from '../../../../src/modules/marketing/campaign-send.model';
import { logger } from '../../../../src/utils/logger';
import { eventually, settle } from './marketing.fixtures';
import { TRACKING_PATH, readSend, seedSend, trackingApp as app } from './tracking.fixtures';

let logError: jest.SpyInstance;

beforeEach(() => {
  logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('the open pixel', () => {
  it('answers with an uncacheable GIF and counts the open against the recipient', async () => {
    const { token, id } = await seedSend();

    const response = await request(app()).get(`${TRACKING_PATH}/o/${token}.gif`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/gif');
    expect(response.headers['cache-control']).toContain('no-store');
    expect(Buffer.compare(response.body as Buffer, PIXEL)).toBe(0);
    const row = await eventually(
      () => readSend(id),
      (send) => send?.openCount === 1,
    );
    expect(row?.openedAt).toBeInstanceOf(Date);
  });

  it('keeps the first open time while counting every load', async () => {
    const { token, id } = await seedSend();
    await request(app()).get(`${TRACKING_PATH}/o/${token}.gif`);
    const first = await eventually(
      () => readSend(id),
      (send) => send?.openCount === 1,
    );

    await request(app()).get(`${TRACKING_PATH}/o/${token}.gif`);

    const second = await eventually(
      () => readSend(id),
      (send) => send?.openCount === 2,
    );
    expect(second?.openedAt).toEqual(first?.openedAt);
  });

  it('answers the same for an unknown token, confirming nothing', async () => {
    const { id } = await seedSend();

    const response = await request(app()).get(`${TRACKING_PATH}/o/unknown-token.gif`);

    expect(response.status).toBe(200);
    await settle();
    expect((await readSend(id))?.openCount).toBe(0);
  });

  it('still serves the pixel when recording the open fails, and logs it', async () => {
    const { token } = await seedSend();
    jest.spyOn(CampaignSendModel, 'updateOne').mockImplementationOnce(() => {
      throw new Error('db blip');
    });

    const response = await request(app()).get(`${TRACKING_PATH}/o/${token}.gif`);

    expect(response.status).toBe(200);
    await eventually(
      async () => logError.mock.calls.length,
      (count) => count > 0,
    );
    expect(logError).toHaveBeenCalledWith(expect.any(Error), 'Recording an open failed');
  });
});
