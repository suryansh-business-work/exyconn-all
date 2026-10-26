import { meteredFetch } from '../tech/usage/usage.meter';
import { env } from '../../config/env';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { randomToken } from '../auth/google/google-sign-in.oauth';
import { accountUrl, basicAuth, verifyTwilio } from '../calling-bot-demo/twilio.client';
import { VOBIZ_API, digitsOf, verifyVobiz } from '../calling-bot-demo/vobiz.client';
import { callConfigs, type UsableCallConfig } from './crm-integrations.configs';
import { CrmCallSessionModel } from './crm-integrations.models';

/** Where Vobiz fetches a bridge's answer XML; the token names one waiting call session. */
export const VOBIZ_ANSWER_PATH = '/integrations/vobiz/answer';

/** One click-to-call: the agent's phone rings first, then the bridge dials the contact. */
export interface Bridge {
  agentPhone: string;
  contactPhone: string;
}

export interface PlacedCall {
  callId: string;
  status: string;
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/** TwiML and VobizXML share this verb: dial one number, showing the company's as caller id. */
export const dialXml = (callerId: string, number: string) =>
  `<Response><Dial callerId="${escapeXml(callerId)}"><Number>${escapeXml(number)}</Number></Dial></Response>`;

/** The provider refused: logged by HTTP status only (no numbers), told to the user plainly. */
function refused(provider: string, status: number): never {
  logger.warn(`${provider} refused a CRM call: HTTP ${status}`);
  badRequest(
    status === 401 || status === 403
      ? `${provider} refused the stored credentials. Check CRM > Integrations.`
      : `${provider} could not place the call (HTTP ${status}).`,
  );
}

/** Twilio rings the agent and runs the inline TwiML when they answer: no callback needed. */
async function twilioBridge(config: UsableCallConfig, bridge: Bridge): Promise<PlacedCall> {
  const response = await meteredFetch(
    'TWILIO',
    'POST Calls',
    `${accountUrl(config.accountId)}/Calls.json`,
    {
      method: 'POST',
      headers: {
        Authorization: basicAuth(config.accountId, config.authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: bridge.agentPhone,
        From: config.fromNumber,
        Twiml: dialXml(config.fromNumber, bridge.contactPhone),
      }),
    },
  );
  if (!response.ok) refused('Twilio', response.status);
  const body = (await response.json()) as { sid?: string; status?: string };
  return { callId: body.sid ?? '', status: body.status ?? 'queued' };
}

/**
 * Vobiz rings the agent and, when they answer, fetches the answer XML from this server. The
 * contact's number waits in a single-use session row; the URL carries only its random token.
 */
async function vobizBridge(config: UsableCallConfig, bridge: Bridge): Promise<PlacedCall> {
  const token = randomToken(24);
  await CrmCallSessionModel.create({
    token,
    dial: digitsOf(bridge.contactPhone),
    callerId: digitsOf(config.fromNumber),
  });
  const response = await meteredFetch(
    'VOBIZ',
    'POST Call',
    `${VOBIZ_API}/Account/${encodeURIComponent(config.accountId)}/Call/`,
    {
      method: 'POST',
      headers: {
        'X-Auth-ID': config.accountId,
        'X-Auth-Token': config.authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: digitsOf(config.fromNumber),
        to: digitsOf(bridge.agentPhone),
        answer_url: `${env.apiPublicUrl}${VOBIZ_ANSWER_PATH}/${token}`,
        answer_method: 'POST',
      }),
    },
  );
  if (!response.ok) {
    await CrmCallSessionModel.deleteOne({ token });
    refused('Vobiz', response.status);
  }
  const body = (await response.json()) as { request_uuid?: string; message?: string };
  return { callId: body.request_uuid ?? '', status: 'queued' };
}

/** Places the bridge through the company's active calling account. */
export async function placeBridgeCall(bridge: Bridge) {
  const config = await callConfigs.active();
  if (!config) {
    badRequest('Calling is not set up. Connect Twilio or Vobiz in CRM > Integrations.');
  }
  const placed =
    config.provider === 'TWILIO'
      ? await twilioBridge(config, bridge)
      : await vobizBridge(config, bridge);
  return { ...placed, provider: config.provider };
}

/** Proves a stored calling account by reading it from the provider; places no call. */
export async function testCallConfig(id: string): Promise<string> {
  const config = await callConfigs.usable(id);
  if (config.provider === 'TWILIO') {
    const name = await verifyTwilio(config.accountId, config.authToken);
    return `Twilio accepted the credentials for ${name}.`;
  }
  await verifyVobiz(config.accountId, config.authToken);
  return 'Vobiz accepted the credentials.';
}
