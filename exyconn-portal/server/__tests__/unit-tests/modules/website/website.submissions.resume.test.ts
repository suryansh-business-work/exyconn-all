import type { GraphQLContext } from '../../../../src/middleware/auth';
import { WebsiteSubmissionModel } from '../../../../src/modules/website/models';
import { websiteSubmissionResolvers } from '../../../../src/modules/website/website.submissions.resolvers';
import { imageUploader } from '../../../../src/utils/imagekit';
import { solvedCaptcha } from '../../../helpers';

jest.mock('../../../../src/utils/imagekit', () => ({
  imageUploader: { uploadResume: jest.fn() },
}));
jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendFormSubmissionEmail: jest.fn() },
}));

const uploadResume = imageUploader.uploadResume as jest.Mock;
const HOSTED = 'https://cdn.example.test/resumes/cv.pdf';
const PDF = `data:application/pdf;base64,${Buffer.from('%PDF-1.7\n').toString('base64')}`;
const visitor: GraphQLContext = { user: null, ip: '203.0.113.11' };

const apply = (name: string) =>
  websiteSubmissionResolvers.Mutation.createWebsiteSubmission(
    null,
    {
      input: {
        formType: 'job-application',
        submissionData: { firstName: 'Meera', lastName: 'Iyer', email: 'meera@example.com' },
      },
      captcha: solvedCaptcha(),
      resume: { name, data: PDF },
    },
    visitor,
  ) as Promise<{ id: string }>;

beforeEach(() => {
  uploadResume.mockResolvedValue(HOSTED);
});

describe('the name a résumé is hosted under', () => {
  it('falls back to "resume" when the browser sent only a folder', async () => {
    const created = await apply(String.raw`C:\fakepath\ `);

    expect(uploadResume).toHaveBeenCalledWith(PDF, 'resume');
    const saved = await WebsiteSubmissionModel.findById(created.id).lean();
    expect(saved?.submissionData).toMatchObject({ resumeName: 'resume', resumeUrl: HOSTED });
  });

  it('keeps the end of a very long name, extension included', async () => {
    await apply(`${'a'.repeat(200)}.pdf`);

    const [, hostedName] = uploadResume.mock.calls[0];
    expect(hostedName).toHaveLength(120);
    expect(hostedName.endsWith('.pdf')).toBe(true);
  });

  it('drops the folders of a Unix path', async () => {
    await apply('/home/meera/cv.pdf');

    expect(uploadResume).toHaveBeenCalledWith(PDF, 'cv.pdf');
  });
});
