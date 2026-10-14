import type { CallingBotConfigRecord } from '@exyconn/calling-bot-demo-server';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';

/** Twilio's REST API for one account (twilio.com/docs/voice/api). */
const accountUrl = (accountSid: string): string =>
  `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}`;

const basicAuth = (accountSid: string, authToken: string): string =>
  `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

export interface PlaceTwilioCall {
  config: Pick<
    CallingBotConfigRecord,
    'twilioAccountSid' | 'twilioAuthToken' | 'twilioNumber' | 'maxCallSeconds'
  >;
  to: string;
  /** Where Twilio fetches the TwiML when the phone answers. */
  answerUrl: string;
  /** Where Twilio reports the end of the call. */
  statusUrl: string;
}

/**
 * Asks Twilio to ring a number. Resolves to the call's SID once it is queued — the phone may
 * still not answer; the status callback says how it ended.
 */
export async function placeTwilioCall({
  config,
  to,
  answerUrl,
  statusUrl,
}: PlaceTwilioCall): Promise<string> {
  const response = await fetch(`${accountUrl(config.twilioAccountSid)}/Calls.json`, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(config.twilioAccountSid, config.twilioAuthToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: config.twilioNumber,
      Url: answerUrl,
      Method: 'POST',
      StatusCallback: statusUrl,
      StatusCallbackMethod: 'POST',
      StatusCallbackEvent: 'completed',
      TimeLimit: String(config.maxCallSeconds),
    }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: number; message?: string };
    logger.warn(`Twilio refused a call: HTTP ${response.status} code ${body.code ?? 'none'}`);
    badRequest('The phone call could not be placed. Try the browser call instead.');
  }
  const body = (await response.json()) as { sid?: string };
  return body.sid ?? '';
}

/** Proves a Twilio Account SID and Auth Token: reads the account. Resolves to its name. */
export async function verifyTwilio(accountSid: string, authToken: string): Promise<string> {
  const response = await fetch(`${accountUrl(accountSid)}.json`, {
    headers: { Authorization: basicAuth(accountSid, authToken) },
  });
  if (!response.ok) {
    badRequest(`Twilio refused the Account SID or Auth Token (HTTP ${response.status}).`);
  }
  const body = (await response.json()) as { friendly_name?: string; status?: string };
  if (body.status && body.status !== 'active') {
    badRequest(`The Twilio account is ${body.status}.`);
  }
  return body.friendly_name ?? accountSid;
}
