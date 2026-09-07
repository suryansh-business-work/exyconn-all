import { websiteResolvers } from '../../src/modules/website';
import { WebsiteSubmissionModel, JobModel } from '../../src/modules/website/models';
import { recruitingResolvers, ApplicantModel } from '../../src/modules/recruiting';
import { applicantFromSubmission } from '../../src/modules/recruiting/recruiting.service';
import { emailer } from '../../src/modules/email';
import { mailer } from '../../src/utils/mailer';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendFormSubmissionEmail: jest.fn() },
}));

const sendEmail = emailer.send as jest.Mock;
const sendFormEmail = mailer.sendFormSubmissionEmail as jest.Mock;

/** What the website's JobApplicationForm posts, field for field. */
const application = {
  jobId: 'GRP-SM-001',
  jobTitle: 'Old title on the page',
  companyName: 'Exyconn',
  companySlug: 'exyconn',
  firstName: 'Meera',
  lastName: 'Iyer',
  email: 'Meera@Example.com',
  phone: '+91 98765 43210',
  location: 'Pune',
  experience: '4 years',
  noticePeriod: '30 days',
  linkedin: 'https://linkedin.com/in/meera',
  resumeName: 'meera-iyer.pdf',
  coverLetter: 'I have shipped three portals.',
};

const asRole = (role: string): GraphQLContext => ({
  user: { id: 'u1', roles: [role] as never, email: `${role.toLowerCase()}@exyconn.com` },
});

const submit = (submissionData: Record<string, unknown>) =>
  websiteResolvers.Mutation.createWebsiteSubmission(null, {
    input: { formType: 'job-application', submissionData },
  }) as Promise<{ id: string; applicantId: string | null }>;

const setStage = (id: string, stage: string, ctx: GraphQLContext, note = '') =>
  recruitingResolvers.Mutation.setApplicantStage(null, { id, stage: stage as never, note }, ctx);

describe('Applicant from a job application', () => {
  it('maps the website payload onto an applicant', () => {
    const applicant = applicantFromSubmission(application, 's1', 'Senior Engineer');

    expect(applicant).toMatchObject({
      jobCode: 'GRP-SM-001',
      jobTitle: 'Senior Engineer',
      companySlug: 'exyconn',
      name: 'Meera Iyer',
      email: 'meera@example.com',
      phone: '+91 98765 43210',
      resumeUrl: 'meera-iyer.pdf',
      coverLetter: 'I have shipped three portals.',
      source: 'WEBSITE',
      stage: 'NEW',
      submissionId: 's1',
    });
    expect(applicant.notes).toContain('location: Pune');
    expect(applicant.notes).toContain('linkedin: https://linkedin.com/in/meera');
  });

  it('files an applicant when the job-application form is submitted', async () => {
    await JobModel.create({
      jobCode: 'GRP-SM-001',
      companySlug: 'exyconn',
      title: 'Senior Engineer',
      category: 'Engineering',
      jobType: 'Full Time',
      experienceLevel: 'Senior',
      workMode: 'Remote',
    });

    const submission = await submit(application);

    const applicant = await ApplicantModel.findOne({ email: 'meera@example.com' }).lean();
    expect(applicant).toMatchObject({
      jobTitle: 'Senior Engineer',
      stage: 'NEW',
      source: 'WEBSITE',
      submissionId: submission.id,
    });
    expect(submission.applicantId).toBe(String(applicant?._id));
    const saved = await WebsiteSubmissionModel.findById(submission.id).lean();
    expect(saved?.applicantId).toBe(String(applicant?._id));
    expect(sendFormEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps the page title when the job is not in the catalogue', async () => {
    await submit(application);

    const applicant = await ApplicantModel.findOne({ email: 'meera@example.com' }).lean();
    expect(applicant?.jobTitle).toBe('Old title on the page');
  });

  it('stores the submission even when the applicant cannot be filed', async () => {
    const { email: _dropped, ...withoutEmail } = application;

    const submission = await submit(withoutEmail);

    expect(submission.applicantId).toBeNull();
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(1);
    expect(await ApplicantModel.countDocuments()).toBe(0);
  });

  it('does not file an applicant for other forms', async () => {
    await websiteResolvers.Mutation.createWebsiteSubmission(null, {
      input: { formType: 'contact', submissionData: { email: 'a@b.co', message: 'Hi' } },
    });

    expect(await ApplicantModel.countDocuments()).toBe(0);
  });
});

describe('Applicant pipeline', () => {
  const seedApplicant = () =>
    ApplicantModel.create({
      name: 'Meera Iyer',
      email: 'meera@example.com',
      jobTitle: 'Senior Engineer',
      source: 'MANUAL',
    });

  it('moves the stage, stamps when and records who', async () => {
    const applicant = await seedApplicant();
    const before = applicant.stageChangedAt;

    await setStage(String(applicant._id), 'SCREENING', asRole(ROLES.HR), 'CV looks strong');

    const saved = await ApplicantModel.findById(applicant._id).lean();
    expect(saved?.stage).toBe('SCREENING');
    expect(saved?.stageChangedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(saved?.notes).toContain('Screening by hr@exyconn.com — CV looks strong');
  });

  it('emails the applicant on an offer but not on screening', async () => {
    const applicant = await seedApplicant();

    await setStage(String(applicant._id), 'SCREENING', asRole(ROLES.HR));
    expect(sendEmail).not.toHaveBeenCalled();

    await setStage(String(applicant._id), 'OFFER', asRole(ROLES.HR));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      template: 'applicant-stage',
      to: 'meera@example.com',
      variables: { name: 'Meera Iyer', jobTitle: 'Senior Engineer', stageLabel: 'Offer' },
    });
  });

  it('keeps the stage when the email fails', async () => {
    const applicant = await seedApplicant();
    sendEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      setStage(String(applicant._id), 'REJECTED', asRole(ROLES.HR)),
    ).resolves.toMatchObject({ stage: 'REJECTED' });
  });

  it('is HR-only', async () => {
    const applicant = await seedApplicant();

    await expect(setStage(String(applicant._id), 'OFFER', asRole(ROLES.CRM))).rejects.toThrow();
    await expect(setStage(String(applicant._id), 'OFFER', { user: null })).rejects.toThrow();
    expect((await ApplicantModel.findById(applicant._id).lean())?.stage).toBe('NEW');
  });
});
