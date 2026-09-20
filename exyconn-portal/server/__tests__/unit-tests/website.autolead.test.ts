import { autoFileLead, UNASSIGNED } from '../../src/modules/website/website.lead';
import { WebsiteSubmissionModel } from '../../src/modules/website/models';
import { LeadModel } from '../../src/modules/crm/crm.model';
import { useTestOrganization } from '../helpers';

/**
 * The inbox always had a "convert to lead" button, so an enquiry that arrived on Friday
 * evening waited for somebody to open a screen — and an enquiry nobody opened was an enquiry
 * nobody answered.
 */
const submission = (formType: string, data: Record<string, unknown>) =>
  WebsiteSubmissionModel.create({
    formType,
    source: 'website',
    submissionData: data,
    status: 'new',
    notes: '',
  });

const enquiry = {
  name: 'Sam Khan',
  email: 'sam@acme.com',
  company: 'Acme Ltd',
  phone: '+91 80 4000 1000',
  message: 'We need a quote for forty seats.',
};

describe('an enquiry that is a sales lead', () => {
  useTestOrganization();

  it('is filed as one the moment it arrives', async () => {
    const row = await submission('contact', enquiry);

    const leadId = await autoFileLead(String(row._id), 'contact', enquiry);

    const lead = await LeadModel.findById(leadId).lean();
    expect(lead).toMatchObject({
      name: 'Sam Khan',
      email: 'sam@acme.com',
      source: 'WEBSITE',
      stage: 'NEW',
      owner: UNASSIGNED,
    });
    expect(lead?.notes).toContain('We need a quote for forty seats.');
    expect(lead?.notes).toContain('Acme Ltd');
  });

  it('is linked back, so the inbox will not file it twice', async () => {
    const row = await submission('contact', enquiry);

    const leadId = await autoFileLead(String(row._id), 'contact', enquiry);

    const stored = await WebsiteSubmissionModel.findById(row._id).lean();
    expect(stored?.leadId).toBe(leadId);
  });

  it('takes an India-offer enquiry too, company name and all', async () => {
    const data = { fullName: 'Priya Nair', email: 'priya@nimbus.in', business: 'Nimbus Pvt' };
    const row = await submission('india-offer', data);

    const leadId = await autoFileLead(String(row._id), 'india-offer', data);

    const lead = await LeadModel.findById(leadId).lean();
    expect(lead?.name).toBe('Priya Nair');
    expect(lead?.notes).toContain('Nimbus Pvt');
  });
});

describe('an enquiry that is not', () => {
  useTestOrganization();

  it('leaves a grievance, a legal notice, a job application and a newsletter alone', async () => {
    for (const formType of ['grievance', 'legal', 'job-application', 'newsletter', 'career']) {
      const row = await submission(formType, enquiry);

      expect(await autoFileLead(String(row._id), formType, enquiry)).toBeNull();
    }

    expect(await LeadModel.countDocuments()).toBe(0);
  });

  it('files nothing when there is no address to reply to', async () => {
    const data = { name: 'Anonymous', message: 'Something is wrong.' };
    const row = await submission('contact', data);

    expect(await autoFileLead(String(row._id), 'contact', data)).toBeNull();
    expect(await LeadModel.countDocuments()).toBe(0);
  });
});
