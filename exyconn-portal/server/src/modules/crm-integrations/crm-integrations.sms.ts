import { meteredFetch } from '../tech/usage/usage.meter';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { accountUrl, basicAuth, verifyTwilio } from '../calling-bot-demo/twilio.client';
import { digitsOf } from '../calling-bot-demo/vobiz.client';
import { smsConfigs, type UsableSmsConfig } from './crm-integrations.configs';

const MSG91_FLOW_URL = 'https://control.msg91.com/api/v5/flow';
/** MSG91's balance check; route 4 is transactional SMS. Reading it proves the auth key. */
const MSG91_BALANCE_URL = 'https://control.msg91.com/api/balance.php';

export interface SentSms {
  messageId: string;
  status: string;
}

/** The provider refused: logged by HTTP status only (no number, no text). */
function refused(provider: string, status: number): never {
  logger.warn(`${provider} refused a CRM text: HTTP ${status}`);
  badRequest(
    status === 401 || status === 403
      ? `${provider} refused the stored credentials. Check CRM > Integrations.`
      : `${provider} could not send the text (HTTP ${status}).`,
  );
}

async function twilioSms(config: UsableSmsConfig, to: string, body: string): Promise<SentSms> {
  const response = await meteredFetch(
    'TWILIO',
    'POST Messages (SMS)',
    `${accountUrl(config.accountId)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: basicAuth(config.accountId, config.authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: config.fromNumber, To: to, Body: body }),
    },
  );
  if (!response.ok) refused('Twilio', response.status);
  const sent = (await response.json()) as { sid?: string; status?: string };
  return { messageId: sent.sid ?? '', status: sent.status ?? 'queued' };
}

/**
 * MSG91 sends a DLT-approved flow template; the text rides in the template's variable, so it
 * is delivered only as far as the approved template allows.
 */
async function msg91Sms(config: UsableSmsConfig, to: string, body: string): Promise<SentSms> {
  const response = await meteredFetch('MSG91', 'POST flow (SMS)', MSG91_FLOW_URL, {
    method: 'POST',
    headers: { authkey: config.authToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: config.templateId,
      sender: config.senderId,
      short_url: '0',
      recipients: [{ mobiles: digitsOf(to), [config.messageVariable]: body }],
    }),
  });
  if (!response.ok) refused('MSG91', response.status);
  const sent = (await response.json()) as { type?: string; message?: string };
  if (sent.type !== 'success') {
    logger.warn('MSG91 refused a CRM text');
    badRequest(`MSG91 did not send the text: ${sent.message ?? 'no reason given'}.`);
  }
  return { messageId: sent.message ?? '', status: 'queued' };
}

/** Sends through the company's active SMS account. */
export async function sendSms(to: string, body: string) {
  const config = await smsConfigs.active();
  if (!config) {
    badRequest('SMS is not set up. Connect Twilio or MSG91 in CRM > Integrations.');
  }
  const sent =
    config.provider === 'TWILIO'
      ? await twilioSms(config, to, body)
      : await msg91Sms(config, to, body);
  return { ...sent, provider: config.provider };
}

/** Proves a stored SMS account by reading it from the provider; sends nothing. */
export async function testSmsConfig(id: string): Promise<string> {
  const config = await smsConfigs.usable(id);
  if (config.provider === 'TWILIO') {
    const name = await verifyTwilio(config.accountId, config.authToken);
    return `Twilio accepted the credentials for ${name}.`;
  }
  const params = new URLSearchParams({ authkey: config.authToken, type: '4' });
  const response = await meteredFetch(
    'MSG91',
    'GET balance',
    `${MSG91_BALANCE_URL}?${params.toString()}`,
  );
  const balance = (await response.text()).trim();
  if (!response.ok || !/^\d+(\.\d+)?$/.test(balance)) {
    badRequest('MSG91 refused the auth key.');
  }
  return `MSG91 accepted the auth key (balance ${balance}).`;
}
