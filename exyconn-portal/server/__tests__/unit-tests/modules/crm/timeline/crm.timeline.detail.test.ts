import { Types } from 'mongoose';
import { ROLES } from '../../../../../src/constants/roles';
import { invalidatePermissionCache } from '../../../../../src/lib/permissions';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { DealModel } from '../../../../../src/modules/crm/deal.model';
import { crmTimelineResolvers } from '../../../../../src/modules/crm/timeline/crm.timeline';
import { EmailLogModel } from '../../../../../src/modules/email/email-log.model';
import { CrmEmailMessageModel } from '../../../../../src/modules/gmail/gmail.models';
import { WebsiteSubmissionModel } from '../../../../../src/modules/website/models/submission.model';
import { RolePermissionModel } from '../../../../../src/modules/permissions/permission.model';
import { WhatsappDemoVisitorModel } from '../../../../../../../demos/whatsapp-demo/server/src/visitor/visitor.model';
import { crmUser } from '../../crm-integrations/fixtures';

const AT = new Date(Date.UTC(2026, 9, 15, 10));
const ISO = AT.toISOString();
const { crmTimelineDetail } = crmTimelineResolvers.Query;

const detailOf = (object: 'CONTACT' | 'COMPANY', id: string, itemId: string) =>
  crmTimelineDetail(null, { object, id, itemId }, crmUser());

const inserted = async (insert: Promise<{ insertedId: Types.ObjectId }>) =>
  (await insert).insertedId.toHexString();

const text = (label: string, value: string) => ({ label, value, type: 'TEXT' });
const date = (label: string) => ({ label, value: ISO, type: 'DATE' });

async function contact(email = 'asha@acme.com') {
  return ContactModel.create({ name: 'Asha', email, owner: 'A' });
}

afterEach(() => {
  invalidatePermissionCache();
});

describe('the details of a CRM email', () => {
  it('has its sender, recipients, mailbox and full text; an empty cc is left out', async () => {
    const asha = await contact();
    const id = await inserted(
      CrmEmailMessageModel.collection.insertOne({
        participants: ['asha@acme.com'],
        direction: 'OUT',
        from: 'sales@exyconn.com',
        to: ['asha@acme.com', 'ops@acme.com'],
        cc: [],
        mailbox: 'sales@exyconn.com',
        subject: 'Introduction',
        snippet: 'Hi',
        bodyText: 'Hi Asha,\nGlad to meet.',
        sentByName: 'Ravi',
        sentAt: AT,
      }),
    );

    await expect(detailOf('CONTACT', asha.id, `gmail:${id}`)).resolves.toEqual({
      fields: [
        text('Subject', 'Introduction'),
        text('From', 'sales@exyconn.com'),
        text('To', 'asha@acme.com, ops@acme.com'),
        text('Mailbox', 'sales@exyconn.com'),
        date('Date'),
        text('Sent by', 'Ravi'),
      ],
      body: 'Hi Asha,\nGlad to meet.',
    });
  });

  it('falls back to the decoded snippet when no text was kept', async () => {
    const asha = await contact();
    const id = await inserted(
      CrmEmailMessageModel.collection.insertOne({
        participants: ['asha@acme.com'],
        direction: 'IN',
        from: 'asha@acme.com',
        to: [],
        cc: ['boss@acme.com'],
        snippet: 'you&#39;re right',
        bodyText: '',
        sentAt: AT,
      }),
    );

    const detail = await detailOf('CONTACT', asha.id, `gmail:${id}`);
    expect(detail.body).toBe("you're right");
    expect(detail.fields).toContainEqual(text('Cc', 'boss@acme.com'));
  });
});

describe('the details of a logged activity', () => {
  it('has every field it holds and its notes', async () => {
    const asha = await contact();
    const id = await inserted(
      ActivityModel.collection.insertOne({
        type: 'CALL',
        subject: 'Pricing call',
        notes: 'Wants a pilot',
        relatedType: 'CONTACT',
        relatedId: asha.id,
        relatedName: 'Asha',
        owner: 'Ravi',
        assigneeName: 'Mia',
        dueDate: AT,
        remindAt: null,
        durationSeconds: 125,
        done: true,
        createdAt: AT,
      }),
    );

    await expect(detailOf('CONTACT', asha.id, `activity:${id}`)).resolves.toEqual({
      fields: [
        text('Type', 'CALL'),
        text('Subject', 'Pricing call'),
        text('About', 'Asha'),
        text('Owner', 'Ravi'),
        text('Assigned to', 'Mia'),
        date('Due'),
        text('Duration (minutes)', '2'),
        date('Logged'),
      ],
      body: 'Wants a pilot',
    });
  });

  it('leaves out a duration nobody logged', async () => {
    const asha = await contact();
    const id = await inserted(
      ActivityModel.collection.insertOne({
        type: 'NOTE',
        subject: 'Note',
        notes: '',
        relatedId: asha.id,
        owner: 'Ravi',
        durationSeconds: null,
      }),
    );

    const detail = await detailOf('CONTACT', asha.id, `activity:${id}`);
    expect(detail.fields.map((field) => field.label)).toEqual(['Type', 'Subject', 'Owner']);
  });
});

describe('the details of a deal and a lead', () => {
  it("reads a deal on its company's timeline, its value as money", async () => {
    const acme = await CompanyModel.create({ name: 'Acme', owner: 'A' });
    const id = await inserted(
      DealModel.collection.insertOne({
        title: 'Pilot',
        stage: 'PROPOSAL',
        value: 5000,
        probability: 40,
        expectedCloseDate: AT,
        companyId: acme.id,
        companyName: 'Acme',
        owner: 'Ravi',
        notes: 'Budget approved',
      }),
    );

    const detail = await detailOf('COMPANY', acme.id, `deal:${id}`);
    expect(detail.fields).toEqual([
      text('Title', 'Pilot'),
      text('Stage', 'PROPOSAL'),
      { label: 'Value', value: '5000', type: 'MONEY' },
      text('Probability (%)', '40'),
      date('Expected close'),
      text('Company', 'Acme'),
      text('Owner', 'Ravi'),
    ]);
    expect(detail.body).toBe('Budget approved');
  });

  it('reads a lead by the contact address', async () => {
    const asha = await contact();
    const id = await inserted(
      LeadModel.collection.insertOne({
        name: 'Asha',
        email: 'asha@acme.com',
        source: 'WEBSITE',
        stage: 'NEW',
        value: 0,
        owner: 'Mia',
      }),
    );

    const detail = await detailOf('CONTACT', asha.id, `lead:${id}`);
    expect(detail.fields).toContainEqual({ label: 'Value', value: '0', type: 'MONEY' });
    expect(detail.fields.map((field) => field.label)).toEqual([
      'Name',
      'Email',
      'Source',
      'Stage',
      'Value',
      'Owner',
    ]);
    expect(detail.body).toBe('');
  });
});

describe('the details of what came in by email address', () => {
  it("lists a form's answers, its message as the body", async () => {
    const asha = await contact();
    const id = await inserted(
      WebsiteSubmissionModel.collection.insertOne({
        submissionData: {
          email: 'asha@acme.com',
          seats: 12,
          extra: { nested: true },
          message: 'Call me',
        },
        formType: 'demo',
        status: 'NEW',
      }),
    );
    const noMessage = await inserted(
      WebsiteSubmissionModel.collection.insertOne({
        submissionData: { email: 'asha@acme.com', message: 42 },
        formType: 'contact',
        status: 'READ',
      }),
    );

    await expect(detailOf('CONTACT', asha.id, `submission:${id}`)).resolves.toEqual({
      fields: [
        text('Form', 'demo'),
        text('Status', 'NEW'),
        text('email', 'asha@acme.com'),
        text('seats', '12'),
      ],
      body: 'Call me',
    });
    expect((await detailOf('CONTACT', asha.id, `submission:${noMessage}`)).body).toBe('');
  });

  it("shows a system email's subject, template, status and failure, not its variables", async () => {
    const asha = await contact();
    const id = await inserted(
      EmailLogModel.collection.insertOne({
        templateKey: 'chat-transcript',
        templateName: 'Website chat — conversation transcript',
        to: 'asha@acme.com',
        subject: 'Your chat with Exyconn',
        status: 'FAILED',
        error: 'Mailbox full',
        variables: { code: '123456' },
        attachments: ['chat.pdf'],
        triggeredBy: 'system',
        sentAt: AT,
      }),
    );

    const detail = await detailOf('CONTACT', asha.id, `email-log:${id}`);
    expect(detail).toEqual({
      fields: [
        text('Subject', 'Your chat with Exyconn'),
        text('To', 'asha@acme.com'),
        text('Email', 'Website chat — conversation transcript'),
        text('Status', 'FAILED'),
        text('Error', 'Mailbox full'),
        text('Attachments', 'chat.pdf'),
        text('Triggered by', 'system'),
        date('Sent'),
      ],
      body: '',
    });
    expect(JSON.stringify(detail)).not.toContain('123456');
  });

  it('shows a WhatsApp demo sign-up', async () => {
    const asha = await contact();
    const id = await inserted(
      WhatsappDemoVisitorModel.collection.insertOne({
        name: 'Asha',
        email: 'asha@acme.com',
        company: '',
        phone: '+911234',
        source: 'WEBSITE',
        verifiedAt: AT,
        lastSignInAt: null,
        signInCount: 3,
      }),
    );

    await expect(detailOf('CONTACT', asha.id, `whatsapp:${id}`)).resolves.toEqual({
      fields: [
        text('Name', 'Asha'),
        text('Email', 'asha@acme.com'),
        text('Phone', '+911234'),
        text('Source', 'WEBSITE'),
        date('Verified'),
        text('Sign-ins', '3'),
      ],
      body: '',
    });
  });
});

describe('an entry that is not on this timeline', () => {
  it("is not found: another contact's record, an unknown source or a malformed id", async () => {
    const asha = await contact();
    const other = await contact('ola@else.com');
    const theirs = await inserted(
      ActivityModel.collection.insertOne({
        type: 'NOTE',
        subject: 'Theirs',
        relatedId: other.id,
        owner: 'Ravi',
      }),
    );
    const someId = new Types.ObjectId().toHexString();

    const missing = [
      'gmail',
      'activity',
      'deal',
      'lead',
      'submission',
      'email-log',
      'whatsapp',
    ].map((source) => `${source}:${someId}`);
    for (const itemId of [
      ...missing,
      `activity:${theirs}`,
      `ticket:${someId}`,
      `toString:${someId}`,
      'gmail:not-an-id',
      'gmail',
    ]) {
      await expect(detailOf('CONTACT', asha.id, itemId)).rejects.toThrow(
        'Timeline entry not found',
      );
    }
  });

  it('needs VIEW on the kind of record', async () => {
    await RolePermissionModel.create({ role: ROLES.CRM, module: 'Company', actions: [] });
    const acme = await CompanyModel.create({ name: 'Acme', owner: 'A' });

    await expect(detailOf('COMPANY', acme.id, 'deal:x')).rejects.toThrow(
      'Your role may not view Company',
    );
  });
});
