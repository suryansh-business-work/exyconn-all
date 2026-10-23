import { Types } from 'mongoose';
import { ROLES } from '../../../../../src/constants/roles';
import { invalidatePermissionCache } from '../../../../../src/lib/permissions';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { DealModel } from '../../../../../src/modules/crm/deal.model';
import {
  crmTimeline,
  crmTimelineResolvers,
  timelineTarget,
} from '../../../../../src/modules/crm/timeline/crm.timeline';
import { SupportTicketModel } from '../../../../../src/modules/employee/support.model';
import { EmailLogModel } from '../../../../../src/modules/email/email-log.model';
import { CrmEmailMessageModel } from '../../../../../src/modules/gmail/gmail.models';
import { CampaignSendModel } from '../../../../../src/modules/marketing/campaign-send.model';
import { CampaignModel } from '../../../../../src/modules/marketing/marketing.model';
import { ChatSessionModel } from '../../../../../src/modules/website-chat/models/chat-session.model';
import { WebsiteSubmissionModel } from '../../../../../src/modules/website/models/submission.model';
import { RolePermissionModel } from '../../../../../src/modules/permissions/permission.model';
import { WhatsappDemoVisitorModel } from '../../../../../../../demos/whatsapp-demo/server/src/visitor/visitor.model';
import { crmUser } from '../../crm-integrations/fixtures';

const MISSING_ID = '64b7f0c2a1b2c3d4e5f60718';
const day = (n: number) => new Date(Date.UTC(2026, 0, n));

/** A contact with two addresses (one upper-cased and repeated) and their records everywhere. */
async function seedContactHistory() {
  const asha = await ContactModel.create({
    name: 'Asha',
    email: 'asha@acme.com',
    emails: [{ address: 'asha@acme.com' }, { address: 'ASHA.RAO@gmail.com' }],
    owner: 'A',
  });
  const id = asha.id;
  const campaignId = new Types.ObjectId();
  await ActivityModel.collection.insertMany([
    {
      type: 'NOTE',
      subject: 'Note',
      notes: 'Wants pricing',
      owner: 'Ravi',
      done: true,
      relatedId: id,
      attachments: [{ url: 'https://ik.imagekit.io/a.png', name: 'a.png' }],
      createdAt: day(1),
    },
    {
      type: 'TASK',
      subject: 'Follow up',
      notes: '',
      owner: 'Ravi',
      done: false,
      relatedId: id,
      createdAt: day(2),
    },
  ]);
  await DealModel.collection.insertOne({
    title: 'Pilot',
    stage: 'PROPOSAL',
    value: 5000,
    owner: 'Ravi',
    contactId: id,
    createdAt: day(3),
  });
  await LeadModel.collection.insertOne({
    email: 'asha@acme.com',
    source: 'WEBSITE',
    notes: 'From the form',
    owner: 'Mia',
    stage: 'NEW',
    createdAt: day(4),
  });
  await WebsiteSubmissionModel.collection.insertMany([
    {
      submissionData: { email: 'asha.rao@gmail.com', message: 'Hello' },
      formType: 'contact',
      status: 'NEW',
      createdAt: day(5),
    },
    {
      submissionData: { email: 'asha@acme.com', message: 42 },
      formType: 'demo',
      status: 'READ',
      createdAt: day(6),
    },
  ]);
  await ChatSessionModel.collection.insertOne({
    email: 'asha@acme.com',
    messageCount: 4,
    lastMessagePreview: 'Thanks!',
    assigneeName: 'Mia',
    status: 'CLOSED',
    createdAt: day(7),
  });
  const ticket = await SupportTicketModel.collection.insertOne({
    requesterEmail: 'asha@acme.com',
    reference: 'T-1',
    subject: 'Login',
    description: 'Cannot sign in',
    assigneeName: 'Ola',
    status: 'OPEN',
    createdAt: day(8),
  });
  await CampaignModel.collection.insertOne({ _id: campaignId, name: 'Spring launch' });
  await CampaignSendModel.collection.insertMany([
    {
      to: 'asha@acme.com',
      campaignId: campaignId.toHexString(),
      sentAt: day(9),
      openedAt: day(9),
      openCount: 3,
      clickCount: 1,
      status: 'SENT',
    },
    {
      to: 'asha@acme.com',
      campaignId: MISSING_ID,
      sentAt: day(10),
      openedAt: null,
      status: 'SENT',
    },
    {
      to: 'asha@acme.com',
      campaignId: MISSING_ID,
      sentAt: day(11),
      openedAt: day(11),
      status: 'SENT',
    },
  ]);
  await EmailLogModel.collection.insertOne({
    to: 'asha@acme.com',
    subject: 'Welcome',
    templateName: 'welcome',
    triggeredBy: 'system',
    status: 'SENT',
    sentAt: day(12),
  });
  await WhatsappDemoVisitorModel.collection.insertMany([
    { email: 'asha@acme.com', company: 'Acme', source: 'WEBSITE', createdAt: day(13) },
    { email: 'asha.rao@gmail.com', company: null, source: 'DEMOS', createdAt: day(14) },
  ]);
  await CrmEmailMessageModel.collection.insertMany([
    {
      participants: ['asha@acme.com'],
      direction: 'OUT',
      subject: 'Pricing',
      from: 'sales@exyconn.com',
      // Gmail sends snippets HTML-escaped.
      snippet: 'Attached &amp; you&#39;re set',
      sentByName: 'Ravi',
      sentAt: day(15),
    },
    {
      participants: ['asha@acme.com'],
      direction: 'IN',
      subject: 'Re: Pricing',
      from: 'asha@acme.com',
      snippet: 'Thanks',
      sentByName: null,
      sentAt: day(16),
    },
  ]);
  return { id, ticketId: ticket.insertedId.toHexString(), campaignId: campaignId.toHexString() };
}

afterEach(() => {
  invalidatePermissionCache();
});

describe('a contact timeline', () => {
  it('merges every source, newest first, matched by any of the contact addresses', async () => {
    const { id, ticketId, campaignId } = await seedContactHistory();

    const items = await crmTimeline('CONTACT', id, null);

    expect(items.map((item) => item.kind)).toEqual([
      'EMAIL',
      'EMAIL',
      'WHATSAPP_LEAD',
      'WHATSAPP_LEAD',
      'SYSTEM_EMAIL',
      'CAMPAIGN_EMAIL',
      'CAMPAIGN_EMAIL',
      'CAMPAIGN_EMAIL',
      'SUPPORT_TICKET',
      'WEBSITE_CHAT',
      'FORM_SUBMISSION',
      'FORM_SUBMISSION',
      'LEAD',
      'DEAL',
      'TASK',
      'NOTE',
    ]);
    const [
      replyIn,
      sentOut,
      noCompany,
      withCompany,
      system,
      openedNoCounts,
      unopened,
      opened,
      ticket,
      chat,
      numberMessage,
      form,
      lead,
      deal,
      task,
      note,
    ] = items;
    expect(replyIn).toMatchObject({
      title: 'Email from asha@acme.com: Re: Pricing',
      actor: '',
      status: 'Received',
      url: `/contacts/${id}/emails`,
    });
    expect(sentOut).toMatchObject({
      title: 'Emailed: Pricing',
      actor: 'Ravi',
      status: 'Sent',
      summary: "Attached & you're set",
      url: `/contacts/${id}/emails`,
      opensPage: false,
    });
    expect(noCompany).toMatchObject({
      summary: '',
      status: 'DEMOS',
      url: '/website/whatsapp-leads',
    });
    expect(withCompany.summary).toBe('Acme');
    expect(system).toMatchObject({
      title: 'Sent the email "Welcome"',
      summary: 'welcome',
      actor: 'system',
      url: '/tech/email/logs',
    });
    expect(openedNoCounts).toMatchObject({
      title: 'Received the campaign "email"',
      summary: 'Opened 1×, clicked 0×',
    });
    expect(unopened).toMatchObject({
      summary: 'Not opened',
      url: `/marketing/campaigns/${MISSING_ID}`,
    });
    expect(opened).toMatchObject({
      title: 'Received the campaign "Spring launch"',
      summary: 'Opened 3×, clicked 1×',
      url: `/marketing/campaigns/${campaignId}`,
    });
    expect(ticket).toMatchObject({
      title: 'Support ticket T-1: Login',
      summary: 'Cannot sign in',
      url: `/support/tickets/${ticketId}`,
      opensPage: true,
    });
    expect(chat).toMatchObject({ title: 'Chatted on the website (4 messages)', actor: 'Mia' });
    expect(chat.url).toBe(`/website/chat/sessions/${chat.id.replace('chat:', '')}`);
    expect(numberMessage).toMatchObject({
      title: 'Submitted the demo form on the website',
      summary: '',
    });
    expect(form).toMatchObject({ summary: 'Hello', status: 'NEW', url: '/website/submissions' });
    expect(lead).toMatchObject({
      title: 'Became a lead from WEBSITE',
      actor: 'Mia',
      url: '/leads',
    });
    expect(deal).toMatchObject({
      title: 'Deal: Pilot',
      summary: 'PROPOSAL · 5000',
      url: '/deals/list',
    });
    expect(task).toMatchObject({ status: '', attachments: [] });
    // An ordinary activity has no page of its own.
    expect(note).toMatchObject({
      url: '',
      status: 'Done',
      summary: 'Wants pricing',
      attachments: [{ url: 'https://ik.imagekit.io/a.png', name: 'a.png' }],
    });
  });

  it('keeps the requested number of items, at least one and at most 200', async () => {
    const { id } = await seedContactHistory();

    expect(await crmTimeline('CONTACT', id, 3)).toHaveLength(3);
    expect(await crmTimeline('CONTACT', id, 0)).toHaveLength(1);
    expect(await crmTimeline('CONTACT', id, 500)).toHaveLength(16);
  });

  it('carries when a task’s reminder is due, and nothing for other entries', async () => {
    const asha = await ContactModel.create({ name: 'Asha', email: 'asha@acme.com', owner: 'A' });
    const remindAt = day(20);
    await ActivityModel.create([
      {
        type: 'TASK',
        subject: 'Send the quote',
        relatedType: 'CONTACT',
        relatedId: asha.id,
        relatedName: 'Asha',
        owner: 'A',
        remindAt,
      },
      {
        type: 'NOTE',
        subject: 'Met at the fair',
        relatedType: 'CONTACT',
        relatedId: asha.id,
        relatedName: 'Asha',
        owner: 'A',
      },
    ]);

    const items = await crmTimeline('CONTACT', asha.id, 10);

    expect(items.find((item) => item.title === 'Send the quote')?.remindAt).toEqual(remindAt);
    expect(items.find((item) => item.title === 'Met at the fair')?.remindAt).toBeNull();
  });

  it('reads an older contact with only its single address', async () => {
    const { insertedId } = await ContactModel.collection.insertOne({
      name: 'Old',
      email: ' OLD@x.com ',
    });

    await expect(timelineTarget('CONTACT', insertedId.toHexString(), 5)).resolves.toEqual({
      addresses: ['old@x.com'],
      contactIds: [insertedId.toHexString()],
      companyId: '',
      recordPath: `/contacts/${insertedId.toHexString()}`,
      limit: 5,
    });
  });

  it('says a missing contact or company is not found', async () => {
    await expect(crmTimeline('CONTACT', MISSING_ID, 10)).rejects.toThrow('Contact not found');
    await expect(crmTimeline('COMPANY', MISSING_ID, 10)).rejects.toThrow('Company not found');
  });
});

describe('a company timeline', () => {
  it('covers the company own addresses, its deals and every person at it', async () => {
    const acme = await CompanyModel.create({
      name: 'Acme',
      domain: 'acme.com',
      owner: 'A',
      emails: [{ address: 'info@acme.com' }],
    });
    const asha = await ContactModel.create({
      name: 'Asha',
      email: 'asha@acme.com',
      owner: 'A',
      companyId: acme.id,
    });
    await DealModel.collection.insertOne({
      title: 'Renewal',
      stage: 'WON',
      value: 100,
      owner: 'Ravi',
      companyId: acme.id,
      createdAt: day(2),
    });
    await LeadModel.collection.insertOne({
      email: 'info@acme.com',
      source: 'IMPORT',
      notes: '',
      owner: '',
      stage: 'NEW',
      createdAt: day(1),
    });

    const target = await timelineTarget('COMPANY', acme.id, 10);
    expect(target).toEqual({
      addresses: ['info@acme.com', 'asha@acme.com'],
      contactIds: [asha.id],
      companyId: acme.id,
      recordPath: `/companies/${acme.id}`,
      limit: 10,
    });
    const items = await crmTimeline('COMPANY', acme.id, undefined);
    expect(items.map((item) => item.title)).toEqual(['Deal: Renewal', 'Became a lead from IMPORT']);
  });
});

describe('the timeline query', () => {
  it('needs VIEW on the kind of record', async () => {
    await RolePermissionModel.create({ role: ROLES.CRM, module: 'Company', actions: [] });
    const asha = await ContactModel.create({ name: 'Asha', email: 'asha@acme.com', owner: 'A' });
    const { crmTimeline: query } = crmTimelineResolvers.Query;

    await expect(query(null, { object: 'CONTACT', id: asha.id }, crmUser())).resolves.toEqual([]);
    await expect(
      query(null, { object: 'COMPANY', id: MISSING_ID, limit: 5 }, crmUser()),
    ).rejects.toThrow('Your role may not view Company');
  });
});
