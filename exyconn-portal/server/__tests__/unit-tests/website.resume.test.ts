import { websiteResolvers } from '../../src/modules/website';
import { WebsiteSubmissionModel } from '../../src/modules/website/models';
import { ApplicantModel } from '../../src/modules/recruiting';
import { imageUploader } from '../../src/utils/imagekit';
import { mailer } from '../../src/utils/mailer';
import type { GraphQLContext } from '../../src/middleware/auth';
import { solvedCaptcha } from '../helpers';

jest.mock('../../src/utils/imagekit', () => ({
  imageUploader: { uploadResume: jest.fn() },
}));
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendFormSubmissionEmail: jest.fn() },
}));

const uploadResume = imageUploader.uploadResume as jest.Mock;
const sendFormEmail = mailer.sendFormSubmissionEmail as jest.Mock;

const HOSTED = 'https://ik.imagekit.io/exyconn/exyconn-portal/resumes/meera-iyer_x1.pdf';
const PDF = `data:application/pdf;base64,${Buffer.from('%PDF-1.7\n').toString('base64')}`;

const visitor: GraphQLContext = { user: null, ip: '198.51.100.21' };

const application = {
  jobId: 'GRP-SM-001',
  jobTitle: 'Senior Engineer',
  companySlug: 'exyconn',
  firstName: 'Meera',
  lastName: 'Iyer',
  email: 'meera@example.com',
  resumeName: 'meera-iyer.pdf',
};

const submit = (
  formType: string,
  submissionData: Record<string, unknown>,
  resume?: { name: string; data: string },
) =>
  websiteResolvers.Mutation.createWebsiteSubmission(
    null,
    { input: { formType, submissionData }, captcha: solvedCaptcha(), resume },
    visitor,
  ) as Promise<{ id: string; applicantId: string | null }>;

describe('Résumé sent with a job application', () => {
  beforeEach(() => {
    uploadResume.mockResolvedValue(HOSTED);
  });

  it('hosts the file and files the applicant with its URL', async () => {
    const submission = await submit('job-application', application, {
      name: String.raw`C:\fakepath\meera-iyer.pdf`,
      data: PDF,
    });

    expect(uploadResume).toHaveBeenCalledWith(PDF, 'meera-iyer.pdf');
    const saved = await WebsiteSubmissionModel.findById(submission.id).lean();
    expect(saved?.submissionData).toMatchObject({
      resumeUrl: HOSTED,
      resumeName: 'meera-iyer.pdf',
    });
    const applicant = await ApplicantModel.findOne({ email: 'meera@example.com' }).lean();
    expect(applicant?.resumeUrl).toBe(HOSTED);
    expect(sendFormEmail.mock.calls[0][0].submissionData.resumeUrl).toBe(HOSTED);
  });

  it('refuses a file on any other form, before it is uploaded or stored', async () => {
    await expect(
      submit('contact', { email: 'a@b.co' }, { name: 'x.pdf', data: PDF }),
    ).rejects.toThrow(/Only a job application/);
    expect(uploadResume).not.toHaveBeenCalled();
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(0);
  });

  it('refuses a file that is not a PDF or Word document', async () => {
    const html = `data:application/pdf;base64,${Buffer.from('<html>').toString('base64')}`;
    await expect(
      submit('job-application', application, { name: 'x.pdf', data: html }),
    ).rejects.toThrow(/cannot be uploaded/);
    expect(uploadResume).not.toHaveBeenCalled();
  });

  it('stores nothing when the upload fails, so the visitor can send again', async () => {
    uploadResume.mockRejectedValue(new Error('ImageKit is down'));

    await expect(
      submit('job-application', application, { name: 'meera-iyer.pdf', data: PDF }),
    ).rejects.toThrow(/ImageKit is down/);
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(0);
  });

  it('still takes an application without a file', async () => {
    const submission = await submit('job-application', application);

    expect(uploadResume).not.toHaveBeenCalled();
    const saved = await WebsiteSubmissionModel.findById(submission.id).lean();
    expect(saved?.submissionData).not.toHaveProperty('resumeUrl');
  });
});
