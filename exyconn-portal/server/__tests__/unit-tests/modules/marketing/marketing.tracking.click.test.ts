import request from 'supertest';
import { signLink } from '../../../../src/modules/marketing/marketing.tracking';
import { CampaignSendModel } from '../../../../src/modules/marketing/campaign-send.model';
import { CampaignClickModel } from '../../../../src/modules/marketing/campaign-click.model';
import { logger } from '../../../../src/utils/logger';
import { eventually, seedCampaign, settle } from './marketing.fixtures';
import { TRACKING_PATH, readSend, seedSend, trackingApp as app } from './tracking.fixtures';

const OFFER = 'https://example.com/offer';

const clickUrl = (token: string, url: string, signature?: string) => {
  const signed = signature === undefined ? '' : `&s=${signature}`;
  return `${TRACKING_PATH}/c/${token}?u=${encodeURIComponent(url)}${signed}`;
};

let logError: jest.SpyInstance;

beforeEach(() => {
  logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('a signed click link', () => {
  it('redirects to the target and records the click against the recipient', async () => {
    const { token, id } = await seedSend();

    const response = await request(app()).get(clickUrl(token, OFFER, signLink(token, OFFER)));

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(OFFER);
    const [click] = await eventually(
      () => CampaignClickModel.find().lean(),
      (rows) => rows.length === 1,
    );
    expect(click).toMatchObject({ campaignId: 'camp-1', sendId: id.toHexString(), url: OFFER });
    const row = await readSend(id);
    expect(row?.clickCount).toBe(1);
    expect(row?.lastClickedAt).toBeInstanceOf(Date);
  });

  it('redirects a validly signed link for an unknown send without recording a click', async () => {
    const response = await request(app()).get(clickUrl('ghost', OFFER, signLink('ghost', OFFER)));

    expect(response.status).toBe(302);
    await settle();
    await expect(CampaignClickModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses a signature that was not made for this target', async () => {
    const { token } = await seedSend();

    const response = await request(app()).get(
      clickUrl(token, 'https://evil.example', signLink(token, OFFER)),
    );

    expect(response.status).toBe(400);
    expect(response.text).toBe('This link is not valid.');
  });

  it('still redirects when recording the click fails, and logs it', async () => {
    const { token } = await seedSend();
    jest.spyOn(CampaignSendModel, 'findOneAndUpdate').mockImplementationOnce(() => {
      throw new Error('db blip');
    });

    const response = await request(app()).get(clickUrl(token, OFFER, signLink(token, OFFER)));

    expect(response.status).toBe(302);
    await eventually(
      async () => logError.mock.calls.length,
      (count) => count > 0,
    );
    expect(logError).toHaveBeenCalledWith(expect.any(Error), 'Recording a click failed');
  });
});

describe('a click link with no usable target', () => {
  it('refuses a missing target', async () => {
    const response = await request(app()).get(`${TRACKING_PATH}/c/tok`);

    expect(response.status).toBe(400);
  });

  it('refuses a target that is not http(s), so the route is not a script redirect', async () => {
    const response = await request(app()).get(clickUrl('tok', 'javascript:alert(1)', 'x'));

    expect(response.status).toBe(400);
  });

  it('refuses a target given more than once', async () => {
    const response = await request(app()).get(`${TRACKING_PATH}/c/tok?u=${OFFER}&u=${OFFER}`);

    expect(response.status).toBe(400);
  });
});

describe('an unsigned link from before signing existed', () => {
  it('follows a link that is in the stored campaign body, character for character', async () => {
    const campaign = await seedCampaign({ body: `<a href="${OFFER}">Offer</a>` });
    const { token } = await seedSend(campaign._id.toHexString());

    const response = await request(app()).get(clickUrl(token, OFFER));

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(OFFER);
  });

  it('refuses a link the campaign body does not contain', async () => {
    const campaign = await seedCampaign({ body: '<a href="https://example.com/other">x</a>' });
    const { token } = await seedSend(campaign._id.toHexString());

    expect((await request(app()).get(clickUrl(token, OFFER))).status).toBe(400);
  });

  it('refuses a link whose campaign has since been deleted', async () => {
    const { token } = await seedSend('000000000000000000000000');

    expect((await request(app()).get(clickUrl(token, OFFER))).status).toBe(400);
  });

  it('refuses a token that belongs to no send, and treats a repeated signature as none', async () => {
    const response = await request(app()).get(`${clickUrl('ghost', OFFER)}&s=a&s=b`);

    expect(response.status).toBe(400);
  });

  it('refuses rather than redirects when the check itself fails', async () => {
    jest.spyOn(CampaignSendModel, 'findOne').mockImplementationOnce(() => {
      throw new Error('db down');
    });

    const response = await request(app()).get(clickUrl('tok', OFFER));

    expect(response.status).toBe(400);
    expect(logError).toHaveBeenCalledWith(expect.any(Error), 'Checking a click link failed');
  });
});
