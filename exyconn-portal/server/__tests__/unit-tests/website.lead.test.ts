import { websiteResolvers } from '../../src/modules/website';
import { leadFromSubmission } from '../../src/modules/website/website.lead';
import { WebsiteSubmissionModel } from '../../src/modules/website/models';
import { LeadModel } from '../../src/modules/crm/crm.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const seedEditor = async () => {
  const user = await UserModel.create({
    name: 'Priya Nair',
    email: 'priya@exyconn.com',
    passwordHash: 'hash',
    roles: [ROLES.WEBSITE],
  });
  const ctx: GraphQLContext = {
    user: { id: String(user._id), roles: [ROLES.WEBSITE], email: user.email },
  };
  return ctx;
};

const seedContact = () =>
  WebsiteSubmissionModel.create({
    formType: 'contact',
    submissionData: {
      firstName: 'Ravi',
      lastName: 'Kumar',
      email: 'Ravi@Acme.com',
      company: 'Acme Ltd',
      message: 'We need a portal.',
    },
  });

const convert = (id: string, ctx: GraphQLContext) =>
  websiteResolvers.Mutation.convertWebsiteSubmissionToLead(null, { id }, ctx) as Promise<{
    id: string;
    name: string;
  }>;

describe('Converting a website submission into a lead', () => {
  it('files the enquiry as a website lead owned by whoever converted it', async () => {
    const ctx = await seedEditor();
    const submission = await seedContact();

    const lead = await convert(String(submission._id), ctx);

    const saved = await LeadModel.findById(lead.id).lean();
    expect(saved).toMatchObject({
      name: 'Ravi Kumar',
      email: 'ravi@acme.com',
      source: 'WEBSITE',
      stage: 'NEW',
      value: 0,
      owner: 'Priya Nair',
    });
    expect(saved?.notes).toContain('contact form');
    expect(saved?.notes).toContain('Company: Acme Ltd');
    expect(saved?.notes).toContain('We need a portal.');
  });

  it('remembers the lead on the submission and moves a new one into review', async () => {
    const ctx = await seedEditor();
    const submission = await seedContact();

    const lead = await convert(String(submission._id), ctx);

    const saved = await WebsiteSubmissionModel.findById(submission._id).lean();
    expect(saved?.leadId).toBe(lead.id);
    expect(saved?.status).toBe('in-review');
  });

  it('refuses a second conversion and names the lead that already exists', async () => {
    const ctx = await seedEditor();
    const submission = await seedContact();
    await convert(String(submission._id), ctx);

    await expect(convert(String(submission._id), ctx)).rejects.toThrow(
      /already converted to lead "Ravi Kumar"/,
    );
    await expect(LeadModel.countDocuments()).resolves.toBe(1);
  });

  it('refuses a submission that carries no email address', async () => {
    const ctx = await seedEditor();
    const submission = await WebsiteSubmissionModel.create({
      formType: 'newsletter',
      submissionData: {},
    });

    await expect(convert(String(submission._id), ctx)).rejects.toThrow(/no email address/);
  });

  it('reads the fields each form calls by a different name', () => {
    const legal = leadFromSubmission(
      'legal',
      { name: 'Meera', email: 'meera@firm.in', details: 'Trademark question' },
      'Priya',
    );
    expect(legal.notes).toContain('Trademark question');

    const offer = leadFromSubmission(
      'india-offer',
      { name: 'Arjun', email: 'arjun@shop.in', business: 'Arjun Stores', phone: '99999' },
      'Priya',
    );
    expect(offer.notes).toContain('Company: Arjun Stores');
    expect(offer.notes).toContain('Phone: 99999');

    const newsletter = leadFromSubmission('newsletter', { email: 'only@mail.com' }, 'Priya');
    expect(newsletter.name).toBe('only@mail.com');
  });
});
