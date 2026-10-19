import { env } from '../../../../src/config/env';
import {
  VOBIZ_ANSWER_PATH,
  dialXml,
  placeBridgeCall,
  testCallConfig,
} from '../../../../src/modules/crm-integrations/crm-integrations.call';
import { callConfigs } from '../../../../src/modules/crm-integrations/crm-integrations.configs';
import { CrmCallSessionModel } from '../../../../src/modules/crm-integrations/crm-integrations.models';
import {
  AGENT_PHONE,
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
  twilioInput,
  vobizInput,
} from './fixtures';

const bridge = { agentPhone: AGENT_PHONE, contactPhone: CONTACT_PHONE };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('dial XML', () => {
  it('escapes every XML special character in the caller id and number', () => {
    expect(dialXml(`a&b<c>"d'`, '+1')).toBe(
      '<Response><Dial callerId="a&amp;b&lt;c&gt;&quot;d&apos;"><Number>+1</Number></Dial></Response>',
    );
  });
});

describe('placing a click-to-call', () => {
  it('refuses while no calling account is active', async () => {
    const fetchSpy = fakeFetch();
    await expect(placeBridgeCall(bridge)).rejects.toThrow('Calling is not set up.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('asks Twilio to ring the agent with inline TwiML dialling the contact', async () => {
    await callConfigs.create(twilioInput(), 'Asha');
    const fetchSpy = fakeFetch(jsonResponse({ sid: 'CA1', status: 'ringing' }, 201));

    await expect(placeBridgeCall(bridge)).resolves.toEqual({
      callId: 'CA1',
      status: 'ringing',
      provider: 'TWILIO',
    });
    expect(fetchedUrl(fetchSpy)).toBe(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
    );
    const form = formBody(fetchSpy);
    expect(form.get('To')).toBe(AGENT_PHONE);
    expect(form.get('From')).toBe(COMPANY_NUMBER);
    expect(form.get('Twiml')).toBe(dialXml(COMPANY_NUMBER, CONTACT_PHONE));
  });

  it('reads a Twilio answer without a sid or status as a queued call', async () => {
    await callConfigs.create(twilioInput(), 'Asha');
    fakeFetch(jsonResponse({}));

    await expect(placeBridgeCall(bridge)).resolves.toEqual({
      callId: '',
      status: 'queued',
      provider: 'TWILIO',
    });
  });

  it('tells the user when Twilio refuses the credentials or the call', async () => {
    await callConfigs.create(twilioInput(), 'Asha');
    fakeFetch(jsonResponse({}, 401), jsonResponse({}, 500));

    await expect(placeBridgeCall(bridge)).rejects.toThrow(
      'Twilio refused the stored credentials. Check CRM > Integrations.',
    );
    await expect(placeBridgeCall(bridge)).rejects.toThrow(
      'Twilio could not place the call (HTTP 500).',
    );
  });

  it('parks the contact number in a session Vobiz answers from by token', async () => {
    await callConfigs.create(vobizInput(), 'Asha');
    const fetchSpy = fakeFetch(jsonResponse({ request_uuid: 'uuid-1' }));

    await expect(placeBridgeCall(bridge)).resolves.toEqual({
      callId: 'uuid-1',
      status: 'queued',
      provider: 'VOBIZ',
    });
    const session = await CrmCallSessionModel.findOne().lean();
    expect(session).toMatchObject({ dial: '919876543210', callerId: '14155550100' });
    expect(fetchedUrl(fetchSpy)).toBe('https://api.vobiz.ai/api/v1/Account/MA_VOBIZ01/Call/');
    expect(fetchedHeaders(fetchSpy)).toMatchObject({
      'X-Auth-ID': 'MA_VOBIZ01',
      'X-Auth-Token': AUTH_TOKEN,
    });
    expect(jsonBody(fetchSpy)).toEqual({
      from: '14155550100',
      to: '14155550111',
      answer_url: `${env.apiPublicUrl}${VOBIZ_ANSWER_PATH}/${session?.token}`,
      answer_method: 'POST',
    });
  });

  it('reads a Vobiz answer without a request id as an empty call id', async () => {
    await callConfigs.create(vobizInput(), 'Asha');
    fakeFetch(jsonResponse({ message: 'ok' }));

    expect((await placeBridgeCall(bridge)).callId).toBe('');
  });

  it('drops the waiting session when Vobiz refuses', async () => {
    await callConfigs.create(vobizInput(), 'Asha');
    fakeFetch(jsonResponse({}, 403), jsonResponse({}, 502));

    await expect(placeBridgeCall(bridge)).rejects.toThrow('Vobiz refused the stored credentials.');
    await expect(placeBridgeCall(bridge)).rejects.toThrow(
      'Vobiz could not place the call (HTTP 502).',
    );
    expect(await CrmCallSessionModel.countDocuments()).toBe(0);
  });
});

describe('testing a stored calling account', () => {
  it('reads the Twilio account and names it', async () => {
    const { id } = await callConfigs.create(twilioInput(), 'Asha');
    const fetchSpy = fakeFetch(jsonResponse({ friendly_name: 'Exyconn', status: 'active' }));

    await expect(testCallConfig(id)).resolves.toBe('Twilio accepted the credentials for Exyconn.');
    expect(fetchedUrl(fetchSpy)).toBe(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}.json`,
    );
  });

  it('reads the Vobiz account', async () => {
    const { id } = await callConfigs.create(vobizInput(), 'Asha');
    fakeFetch(jsonResponse({}));

    await expect(testCallConfig(id)).resolves.toBe('Vobiz accepted the credentials.');
  });

  it('passes on the provider refusal', async () => {
    const { id } = await callConfigs.create(vobizInput(), 'Asha');
    fakeFetch(jsonResponse({}, 401));

    await expect(testCallConfig(id)).rejects.toThrow('Vobiz refused the Auth ID or Auth Token');
  });
});
