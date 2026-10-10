import { Types } from 'mongoose';
import { LeadModel } from '../../../../src/modules/crm/crm.model';
import { WebsiteSubmissionModel } from '../../../../src/modules/website/models';
import {
  UNASSIGNED,
  autoFileLead,
  convertWebsiteSubmissionToLead,
  leadFromSubmission,
} from '../../../../src/modules/website/website.lead';
import { logger } from '../../../../src/utils/logger';
import { ADMIN_EMAIL, adminCtx, customerEditorCtx, seedSubmission } from './website.fixtures';

const convert = (id: unknown) =>
  convertWebsiteSubmissionToLead(null, { id: String(id) }, adminCtx()) as Promise<{
    id: string;
    owner: string;
  }>;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('handing a submission to sales', () => {
  it('names the converter by their email when no account backs the token', async () => {
    const row = await seedSubmission('contact', { email: 'ravi@acme.test' });

    const lead = await convert(row._id);

    expect(lead.owner).toBe(ADMIN_EMAIL);
  });

  it('leaves a submission that was already triaged in its status', async () => {
    const row = await seedSubmission(
      'contact',
      { email: 'ravi@acme.test' },
      { status: 'resolved' },
    );

    const lead = await convert(row._id);

    const saved = await WebsiteSubmissionModel.findById(row._id).lean();
    expect(saved).toMatchObject({ leadId: lead.id, status: 'resolved' });
  });

  it('says so when the submission does not exist', async () => {
    await expect(convert(new Types.ObjectId())).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('names the lead id when the lead it became has since been deleted', async () => {
    const goneLeadId = new Types.ObjectId().toHexString();
    const row = await seedSubmission('contact', { email: 'a@b.co' }, { leadId: goneLeadId });

    await expect(convert(row._id)).rejects.toThrow(`already converted to lead ${goneLeadId}.`);
    expect(await LeadModel.countDocuments()).toBe(0);
  });

  it('refuses a submission stored without any data, for want of an email', async () => {
    const { insertedId } = await WebsiteSubmissionModel.collection.insertOne({
      formType: 'contact',
      submissionData: null,
      status: 'new',
      leadId: null,
    });

    await expect(convert(insertedId)).rejects.toThrow(/no email address/);
  });

  it('refuses a website editor of a customer company', async () => {
    const row = await seedSubmission('contact', { email: 'a@b.co' });

    await expect(
      convertWebsiteSubmissionToLead(null, { id: row._id.toHexString() }, customerEditorCtx()),
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });
});

describe('reading a lead off a form', () => {
  it('prefers a full name, then joins the split one, then falls back to the email', () => {
    expect(
      leadFromSubmission('contact', { fullName: ' Asha Rao ', email: 'a@x.co' }, 'o').name,
    ).toBe('Asha Rao');
    expect(
      leadFromSubmission('contact', { firstName: 'Asha', lastName: ' ', email: 'a@x.co' }, 'o')
        .name,
    ).toBe('Asha');
    expect(
      leadFromSubmission('contact', { name: '  ', lastName: 7, email: 'A@X.co' }, 'o'),
    ).toMatchObject({ name: 'a@x.co', email: 'a@x.co' });
  });

  it('writes notes with only the facts the form carried', () => {
    const bare = leadFromSubmission('newsletter', { email: 'a@x.co' }, 'o');
    expect(bare.notes).toBe('From the website newsletter form.');

    const full = leadFromSubmission(
      'contact',
      { email: 'a@x.co', companyName: 'Acme', phone: '123', subject: 'Pricing' },
      'o',
    );
    expect(full.notes).toBe('From the website contact form.\nCompany: Acme\nPhone: 123\n\nPricing');
  });

  it('refuses a payload whose email is blank', () => {
    expect(() => leadFromSubmission('contact', { email: '   ' }, 'o')).toThrow(/no email address/);
  });
});

describe('filing a lead automatically', () => {
  it('logs and gives up when the CRM refuses the lead, keeping the submission unlinked', async () => {
    const row = await seedSubmission('contact', { email: 'sam@acme.test' });
    jest.spyOn(LeadModel, 'create').mockRejectedValueOnce(new Error('CRM is down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const leadId = await autoFileLead(row._id.toHexString(), 'contact', { email: 'sam@acme.test' });

    expect(leadId).toBeNull();
    expect((await WebsiteSubmissionModel.findById(row._id).lean())?.leadId).toBeNull();
    expect(logged).toHaveBeenCalledWith(
      expect.any(Error),
      `Submission ${row._id.toHexString()} could not be filed as a lead`,
    );
  });

  it('owns an automatic lead as unassigned', async () => {
    const row = await seedSubmission('india-offer', { email: 'p@nimbus.in' });

    const leadId = await autoFileLead(row._id.toHexString(), 'india-offer', {
      email: 'p@nimbus.in',
    });

    expect((await LeadModel.findById(leadId).lean())?.owner).toBe(UNASSIGNED);
  });
});
