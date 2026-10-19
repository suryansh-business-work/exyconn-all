import { smsConfigs } from '../../../../src/modules/crm-integrations/crm-integrations.configs';
import {
  sendSms,
  testSmsConfig,
} from '../../../../src/modules/crm-integrations/crm-integrations.sms';
import {
  AUTH_TOKEN,
  COMPANY_NUMBER,
  CONTACT_PHONE,
  TWILIO_SID,
  fakeFetch,
  fetchedHeaders,
  fetchedUrl,
  formBody,
  jsonBody,
  jsonResponse,
  msg91Input,
  textResponse,
  twilioInput,
} from './fixtures';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sending a CRM text', () => {
  it('refuses while no SMS account is active', async () => {
    await expect(sendSms(CONTACT_PHONE, 'Hi')).rejects.toThrow('SMS is not set up.');
  });

  it('sends through Twilio from the company number', async () => {
    await smsConfigs.create(twilioInput(), 'Asha');
    const fetchSpy = fakeFetch(jsonResponse({ sid: 'SM1', status: 'sent' }, 201));

    await expect(sendSms(CONTACT_PHONE, 'Hello')).resolves.toEqual({
      messageId: 'SM1',
      status: 'sent',
      provider: 'TWILIO',
    });
    expect(fetchedUrl(fetchSpy)).toBe(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    );
    expect(Object.fromEntries(formBody(fetchSpy))).toEqual({
      From: COMPANY_NUMBER,
      To: CONTACT_PHONE,
      Body: 'Hello',
    });
  });

  it('reads a Twilio answer without a sid or status as queued', async () => {
    await smsConfigs.create(twilioInput(), 'Asha');
    fakeFetch(jsonResponse({}));

    await expect(sendSms(CONTACT_PHONE, 'Hello')).resolves.toMatchObject({
      messageId: '',
      status: 'queued',
    });
  });

  it('tells the user when Twilio refuses', async () => {
    await smsConfigs.create(twilioInput(), 'Asha');
    fakeFetch(jsonResponse({}, 403), jsonResponse({}, 429));

    await expect(sendSms(CONTACT_PHONE, 'Hello')).rejects.toThrow(
      'Twilio refused the stored credentials.',
    );
    await expect(sendSms(CONTACT_PHONE, 'Hello')).rejects.toThrow(
      'Twilio could not send the text (HTTP 429).',
    );
  });

  it('sends the text in the MSG91 flow template variable', async () => {
    await smsConfigs.create(msg91Input(), 'Asha');
    const fetchSpy = fakeFetch(jsonResponse({ type: 'success', message: 'req-1' }));

    await expect(sendSms(CONTACT_PHONE, 'Hello')).resolves.toEqual({
      messageId: 'req-1',
      status: 'queued',
      provider: 'MSG91',
    });
    expect(fetchedUrl(fetchSpy)).toBe('https://control.msg91.com/api/v5/flow');
    expect(fetchedHeaders(fetchSpy)).toMatchObject({ authkey: AUTH_TOKEN });
    expect(jsonBody(fetchSpy)).toEqual({
      template_id: 'flow-123',
      sender: 'EXYCON',
      short_url: '0',
      recipients: [{ mobiles: '919876543210', message: 'Hello' }],
    });
  });

  it('reads an MSG91 success without a message as an empty id', async () => {
    await smsConfigs.create(msg91Input(), 'Asha');
    fakeFetch(jsonResponse({ type: 'success' }));

    expect((await sendSms(CONTACT_PHONE, 'Hello')).messageId).toBe('');
  });

  it('passes on the reason MSG91 gives for not sending, or says none was given', async () => {
    await smsConfigs.create(msg91Input(), 'Asha');
    fakeFetch(
      jsonResponse({ type: 'error', message: 'Template not approved' }),
      jsonResponse({ type: 'error' }),
    );

    await expect(sendSms(CONTACT_PHONE, 'Hello')).rejects.toThrow(
      'MSG91 did not send the text: Template not approved.',
    );
    await expect(sendSms(CONTACT_PHONE, 'Hello')).rejects.toThrow(
      'MSG91 did not send the text: no reason given.',
    );
  });

  it('tells the user when MSG91 refuses over HTTP', async () => {
    await smsConfigs.create(msg91Input(), 'Asha');
    fakeFetch(jsonResponse({}, 401), jsonResponse({}, 500));

    await expect(sendSms(CONTACT_PHONE, 'Hello')).rejects.toThrow(
      'MSG91 refused the stored credentials.',
    );
    await expect(sendSms(CONTACT_PHONE, 'Hello')).rejects.toThrow(
      'MSG91 could not send the text (HTTP 500).',
    );
  });
});

describe('testing a stored SMS account', () => {
  it('reads the Twilio account and names it', async () => {
    const { id } = await smsConfigs.create(twilioInput(), 'Asha');
    fakeFetch(jsonResponse({ friendly_name: 'Exyconn' }));

    await expect(testSmsConfig(id)).resolves.toBe('Twilio accepted the credentials for Exyconn.');
  });

  it('reads the MSG91 transactional balance with the auth key', async () => {
    const { id } = await smsConfigs.create(msg91Input(), 'Asha');
    const fetchSpy = fakeFetch(textResponse(' 1250.50\n'));

    await expect(testSmsConfig(id)).resolves.toBe('MSG91 accepted the auth key (balance 1250.50).');
    const url = new URL(fetchedUrl(fetchSpy));
    expect(url.origin + url.pathname).toBe('https://control.msg91.com/api/balance.php');
    expect(url.searchParams.get('authkey')).toBe(AUTH_TOKEN);
    expect(url.searchParams.get('type')).toBe('4');
  });

  it('refuses when MSG91 answers with an error or anything but a balance', async () => {
    const { id } = await smsConfigs.create(msg91Input(), 'Asha');
    fakeFetch(textResponse('1250', 401), textResponse('Authentication failure'));

    await expect(testSmsConfig(id)).rejects.toThrow('MSG91 refused the auth key.');
    await expect(testSmsConfig(id)).rejects.toThrow('MSG91 refused the auth key.');
  });
});
