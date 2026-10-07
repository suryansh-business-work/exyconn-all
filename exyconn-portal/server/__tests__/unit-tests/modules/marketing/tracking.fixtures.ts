import express from 'express';
import {
  TRACKING_PATH,
  marketingTrackingRouter,
} from '../../../../src/modules/marketing/marketing.tracking.routes';
import { newTrackingToken } from '../../../../src/modules/marketing/marketing.tracking';
import { CampaignSendModel } from '../../../../src/modules/marketing/campaign-send.model';

export { TRACKING_PATH };

/** An app serving only the public tracking routes, mounted where the server mounts them. */
export const trackingApp = () => {
  const server = express();
  server.use(TRACKING_PATH, marketingTrackingRouter());
  return server;
};

/** One delivered copy with its own tracking token; returns the token and the row id. */
export async function seedSend(campaignId = 'camp-1') {
  const { token, tokenHash } = newTrackingToken();
  const row = await CampaignSendModel.create({
    campaignId,
    audienceListId: 'aud-1',
    to: 'ada@example.com',
    status: 'SENT',
    trackingTokenHash: tokenHash,
  });
  return { token, id: row._id };
}

export const readSend = (id: unknown) => CampaignSendModel.findById(id).lean();
