import type { GraphQLContext } from '../../../../src/middleware/auth';
import { WebsiteSubmissionModel } from '../../../../src/modules/website/models';
import { websiteSubmissionResolvers } from '../../../../src/modules/website/website.submissions.resolvers';
import { mailer } from '../../../../src/utils/mailer';
import { logger } from '../../../../src/utils/logger';
import { solvedCaptcha } from '../../../helpers';

jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendFormSubmissionEmail: jest.fn() },
}));

const sendFormEmail = mailer.sendFormSubmissionEmail as jest.Mock;
const visitor: GraphQLContext = { user: null, ip: '203.0.113.10' };

const submit = (formType: string, submissionData: Record<string, unknown>) =>
  websiteSubmissionResolvers.Mutation.createWebsiteSubmission(
    null,
    { input: { formType, submissionData }, captcha: solvedCaptcha() },
    visitor,
  ) as Promise<{ id: string }>;

beforeEach(() => {
  sendFormEmail.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the notification email', () => {
  it('replies to the visitor when the form collected their address', async () => {
    await submit('contact', { email: 'sam@acme.test' });

    expect(sendFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({ formType: 'contact', replyTo: 'sam@acme.test' }),
    );
  });

  it('has no reply address when the email is blank or not text', async () => {
    await submit('grievance', { email: '' });
    await submit('grievance', { email: 42 });

    expect(sendFormEmail.mock.calls.map(([args]) => args.replyTo)).toEqual([undefined, undefined]);
  });

  it('still keeps the submission when the email cannot be sent', async () => {
    sendFormEmail.mockRejectedValueOnce(new Error('SMTP down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const created = await submit('legal', { email: 'x@y.co' });

    expect(await WebsiteSubmissionModel.findById(created.id).lean()).not.toBeNull();
    expect(logged).toHaveBeenCalledWith(
      expect.anything(),
      'Submission legal stored, but its email failed',
    );
  });
});
