import express from 'express';
import { Types } from 'mongoose';
import { runForOrganization } from '../../../../src/lib/tenant';
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

/** The company the seeded copies were sent by: a tracking token resolves to it. */
export const SENDER_ORGANIZATION = new Types.ObjectId().toHexString();

/**
 * One copy delivered a minute ago, by a company, with its own tracking token; returns the
 * token and the row id. A minute ago: opens in the first seconds are mail scanners, not reads.
 */
export async function seedSend(campaignId = 'camp-1') {
  const { token, tokenHash } = newTrackingToken();
  const row = await runForOrganization(SENDER_ORGANIZATION, () =>
    CampaignSendModel.create({
      campaignId,
      audienceListId: 'aud-1',
      to: 'ada@example.com',
      status: 'SENT',
      trackingTokenHash: tokenHash,
      sentAt: new Date(Date.now() - 60_000),
    }),
  );
  return { token, id: row._id };
}

export const readSend = (id: unknown) => CampaignSendModel.findById(id).lean();
