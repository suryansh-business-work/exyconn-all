import type { CallingBotConfigRecord } from '@exyconn/calling-bot-demo-server';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';

/** Vobiz's REST API (vobiz.ai/docs). The account path is case-sensitive and ends in a slash. */
export const VOBIZ_API = 'https://api.vobiz.ai/api/v1';

/** Vobiz takes numbers as digits, without the `+` of E.164. */
export const digitsOf = (phone: string): string => phone.replace(/\D/g, '');

export interface PlaceCall {
  config: Pick<
    CallingBotConfigRecord,
    'vobizAuthId' | 'vobizAuthToken' | 'vobizNumber' | 'maxCallSeconds'
  >;
  to: string;
  answerUrl: string;
  hangupUrl: string;
}

/**
 * Asks Vobiz to ring a number. Resolves to Vobiz's id for the request once it is queued — the
 * phone may still not answer; the hangup callback says how it ended.
 */
export async function placeVobizCall({
  config,
  to,
  answerUrl,
  hangupUrl,
}: PlaceCall): Promise<string> {
  const response = await fetch(
    `${VOBIZ_API}/Account/${encodeURIComponent(config.vobizAuthId)}/Call/`,
    {
      method: 'POST',
      headers: {
        'X-Auth-ID': config.vobizAuthId,
        'X-Auth-Token': config.vobizAuthToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: digitsOf(config.vobizNumber),
        to: digitsOf(to),
        answer_url: answerUrl,
        answer_method: 'POST',
        hangup_url: hangupUrl,
        hangup_method: 'POST',
        time_limit: config.maxCallSeconds,
      }),
    },
  );
  if (!response.ok) {
    logger.warn(`Vobiz refused a call: HTTP ${response.status}`);
    badRequest(
      response.status === 402
        ? 'The calling account is out of balance. Try the browser call instead.'
        : 'The phone call could not be placed. Try the browser call instead.',
    );
  }
  const body = (await response.json()) as { request_uuid?: string };
  return body.request_uuid ?? '';
}

/** Proves a Vobiz Auth ID and Auth Token: reads the account they belong to. */
export async function verifyVobiz(authId: string, authToken: string): Promise<void> {
  const response = await fetch(`${VOBIZ_API}/Account/${encodeURIComponent(authId)}/`, {
    headers: { 'X-Auth-ID': authId, 'X-Auth-Token': authToken },
  });
  if (!response.ok) {
    badRequest(`Vobiz refused the Auth ID or Auth Token (HTTP ${response.status}).`);
  }
}
