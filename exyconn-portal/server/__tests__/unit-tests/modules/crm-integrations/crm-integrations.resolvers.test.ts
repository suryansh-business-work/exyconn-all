import { ROLES } from '../../../../src/constants/roles';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { crmIntegrationsResolvers } from '../../../../src/modules/crm-integrations';
import {
  CrmCallConfigModel,
  CrmSmsConfigModel,
} from '../../../../src/modules/crm-integrations/crm-integrations.models';
import {
  AGENT_PHONE,
  CONTACT_PHONE,
  crmUser,
  fakeFetch,
  jsonResponse,
  msg91Input,
  twilioInput,
} from './fixtures';

const { Query, Mutation } = crmIntegrationsResolvers;

const summaries = async () =>
  (await AuditLogModel.find().sort({ createdAt: 1 }).lean()).map((row) => row.summary);

const contactWithPhone = () =>
  ContactModel.create({
    name: 'Asha Rao',
    email: 'asha@acme.com',
    owner: 'A',
    phone: CONTACT_PHONE,
  });

afterEach(() => {
  jest.restoreAllMocks();
  invalidatePlatformOperatorCache();
});

describe('integration status', () => {
  it('shows every channel as not ready in a company with nothing connected', async () => {
    await expect(Query.crmIntegrationStatus(null, {}, crmUser())).resolves.toEqual({
      call: { ready: false, provider: null },
      sms: { ready: false, provider: null },
      email: { gmail: false, microsoft: false },
    });
  });

  it('names the provider of each active account', async () => {
    const ctx = crmUser();
    await Mutation.createCrmCallConfig(null, { input: twilioInput() }, ctx);
    await Mutation.createCrmSmsConfig(null, { input: msg91Input() }, ctx);

    const status = await Query.crmIntegrationStatus(null, {}, ctx);
    expect(status.call).toEqual({ ready: true, provider: 'TWILIO' });
    expect(status.sms).toEqual({ ready: true, provider: 'MSG91' });
  });

  it('is for CRM users only', async () => {
    await expect(Query.crmIntegrationStatus(null, {}, crmUser([ROLES.EMPLOYEE]))).rejects.toThrow();
  });
});

describe('managing the accounts', () => {
  it('lists configs without tokens and no email senders outside the operator CRM', async () => {
    const ctx = crmUser();
    await Mutation.createCrmCallConfig(null, { input: twilioInput() }, ctx);
    await Mutation.createCrmSmsConfig(null, { input: msg91Input() }, ctx);

    const calls = await Query.crmCallConfigs(null, {}, ctx);
    const texts = await Query.crmSmsConfigs(null, {}, ctx);
    expect(calls.map((row) => row.label)).toEqual(['Main line']);
    expect(texts.map((row) => row.label)).toEqual(['MSG91 texts']);
    expect(calls[0]).not.toHaveProperty('authToken');
    await expect(Query.crmEmailSenders(null, {}, ctx)).resolves.toEqual([]);
  });

  it('audits adding, editing and removing an account by name and provider', async () => {
    const ctx = crmUser();
    const call = await Mutation.createCrmCallConfig(null, { input: twilioInput() }, ctx);
    await Mutation.updateCrmCallConfig(
      null,
      { id: call.id, input: twilioInput({ label: 'Sales line', authToken: '' }) },
      ctx,
    );
    await expect(Mutation.deleteCrmCallConfig(null, { id: call.id }, ctx)).resolves.toBe(true);
    const sms = await Mutation.createCrmSmsConfig(null, { input: msg91Input() }, ctx);
    await Mutation.updateCrmSmsConfig(null, { id: sms.id, input: msg91Input() }, ctx);
    await Mutation.deleteCrmSmsConfig(null, { id: sms.id }, ctx);

    expect(await summaries()).toEqual([
      'Added the Twilio call integration Main line',
      'Updated the Twilio call integration Sales line',
      'Removed the Twilio call integration Sales line',
      'Added the MSG91 SMS integration MSG91 texts',
      'Updated the MSG91 SMS integration MSG91 texts',
      'Removed the MSG91 SMS integration MSG91 texts',
    ]);
    expect(await CrmCallConfigModel.countDocuments()).toBe(0);
    expect(await CrmSmsConfigModel.countDocuments()).toBe(0);
  });

  it('tests a stored account against the provider', async () => {
    const ctx = crmUser();
    const call = await Mutation.createCrmCallConfig(null, { input: twilioInput() }, ctx);
    const sms = await Mutation.createCrmSmsConfig(null, { input: msg91Input() }, ctx);
    fakeFetch(jsonResponse({ friendly_name: 'Exyconn' }), new Response('10'));

    await expect(Mutation.testCrmCallConfig(null, { id: call.id }, ctx)).resolves.toBe(
      'Twilio accepted the credentials for Exyconn.',
    );
    await expect(Mutation.testCrmSmsConfig(null, { id: sms.id }, ctx)).resolves.toBe(
      'MSG91 accepted the auth key (balance 10).',
    );
  });

  it('keeps people outside the CRM away from the accounts', async () => {
    await expect(
      Mutation.createCrmCallConfig(null, { input: twilioInput() }, crmUser([ROLES.EMPLOYEE])),
    ).rejects.toThrow();
    expect(await CrmCallConfigModel.countDocuments()).toBe(0);
  });
});

describe('calling and texting a record', () => {
  it('places a click-to-call and logs and audits it on the record', async () => {
    const ctx = crmUser();
    const asha = await contactWithPhone();
    await Mutation.createCrmCallConfig(null, { input: twilioInput() }, ctx);
    fakeFetch(jsonResponse({ sid: 'CA1', status: 'queued' }));

    const placed = await Mutation.startCrmCall(
      null,
      {
        input: { object: 'CONTACT', id: asha.id, to: ` ${CONTACT_PHONE}`, agentPhone: AGENT_PHONE },
      },
      ctx,
    );

    expect(placed).toMatchObject({ callId: 'CA1', status: 'queued', provider: 'TWILIO' });
    const activity = await ActivityModel.findById(placed.activityId).lean();
    expect(activity).toMatchObject({
      type: 'CALL',
      subject: 'Call to Asha Rao',
      notes: `Click-to-call to ${CONTACT_PHONE} through Twilio.`,
      owner: 'sales@exyconn.com',
      relatedId: asha.id,
    });
    expect(await summaries()).toContain('Called Asha Rao through Twilio');
  });

  it('refuses a call to a malformed number before reaching the provider', async () => {
    const fetchSpy = fakeFetch();
    const asha = await contactWithPhone();

    await expect(
      Mutation.startCrmCall(
        null,
        { input: { object: 'CONTACT', id: asha.id, to: CONTACT_PHONE, agentPhone: '12345' } },
        crmUser(),
      ),
    ).rejects.toThrow('Enter your phone number in international format');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends a text and keeps it as a note on the record', async () => {
    const ctx = crmUser();
    const asha = await contactWithPhone();
    await Mutation.createCrmSmsConfig(null, { input: msg91Input() }, ctx);
    fakeFetch(jsonResponse({ type: 'success', message: 'req-9' }));

    const sent = await Mutation.sendCrmSms(
      null,
      { input: { object: 'CONTACT', id: asha.id, to: CONTACT_PHONE, body: ' See you at 4 ' } },
      ctx,
    );

    expect(sent).toMatchObject({ messageId: 'req-9', provider: 'MSG91' });
    const activity = await ActivityModel.findById(sent.activityId).lean();
    expect(activity).toMatchObject({
      type: 'NOTE',
      subject: `SMS to Asha Rao (${CONTACT_PHONE})`,
      notes: 'See you at 4',
    });
    expect(await summaries()).toContain('Texted Asha Rao through MSG91');
  });

  it('refuses to text a number that is not on the record', async () => {
    const asha = await contactWithPhone();

    await expect(
      Mutation.sendCrmSms(
        null,
        { input: { object: 'CONTACT', id: asha.id, to: '+14155550100', body: 'Hi' } },
        crmUser(),
      ),
    ).rejects.toThrow('That number is not on this record.');
    expect(await ActivityModel.countDocuments()).toBe(0);
  });
});
