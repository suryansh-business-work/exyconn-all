import { WhatsappChannelModel } from './channel.model';
import type { Sender } from './channel.graph';
import { organizationOf, runAsPlatform } from '../../../lib/tenant';
import { open } from '../../../utils/secretBox';

/**
 * The webhook arrives before any company is in scope — Meta knows only the phone number id —
 * so these lookups run across every company, and return just enough to enter the right one.
 */

export interface ChannelMatch {
  organizationId: string;
  appSecret: string;
  sender: Sender;
}

async function forNumber(phoneNumberId: string): Promise<ChannelMatch | null> {
  const doc = await runAsPlatform(() =>
    WhatsappChannelModel.findOne({ phoneNumberId, enabled: true }).lean(),
  );
  const organizationId = doc ? organizationOf(doc) : null;
  if (!doc || !organizationId) {
    return null;
  }
  return {
    organizationId,
    appSecret: open(doc.appSecret),
    sender: { phoneNumberId: doc.phoneNumberId, accessToken: open(doc.accessToken) },
  };
}

/** Whether Meta's verification handshake carries a token some company registered. */
async function knowsVerifyToken(verifyToken: string): Promise<boolean> {
  const found = await runAsPlatform(() => WhatsappChannelModel.exists({ verifyToken }));
  return found !== null;
}

/** Whether another company already uses this number id; one number answers one company. */
async function numberTakenElsewhere(phoneNumberId: string, ownId: string | null): Promise<boolean> {
  const found = await runAsPlatform(() =>
    WhatsappChannelModel.exists({ phoneNumberId, ...(ownId ? { _id: { $ne: ownId } } : {}) }),
  );
  return found !== null;
}

export const channelLookup = { forNumber, knowsVerifyToken, numberTakenElsewhere };
