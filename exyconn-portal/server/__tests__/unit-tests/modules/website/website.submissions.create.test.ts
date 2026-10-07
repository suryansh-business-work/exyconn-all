import type { GraphQLContext } from '../../../../src/middleware/auth';
import * as recruitingService from '../../../../src/modules/recruiting/recruiting.service';
import { WebsiteSubmissionModel } from '../../../../src/modules/website/models';
import {
  submissionBurstLimiter,
  submissionDailyLimiter,
  websiteSubmissionResolvers,
} from '../../../../src/modules/website/website.submissions.resolvers';
import { mailer } from '../../../../src/utils/mailer';
import { logger } from '../../../../src/utils/logger';
import { solvedCaptcha } from '../../../helpers';

jest.mock('../../../../src/utils/mailer', () => ({
  mailer: { sendFormSubmissionEmail: jest.fn() },
}));

const sendFormEmail = mailer.sendFormSubmissionEmail as jest.Mock;
const visitor: GraphQLContext = { user: null, ip: '203.0.113.9' };

type Created = { id: string; source: string; status: string; applicantId: string | null };

const submit = (
  input: { formType: string; submissionData: Record<string, unknown>; source?: string },
  ctx: GraphQLContext = visitor,
) =>
  websiteSubmissionResolvers.Mutation.createWebsiteSubmission(
    null,
    { input, captcha: solvedCaptcha() },
    ctx,
  ) as Promise<Created>;

const refusedWith = (promise: Promise<unknown>, pattern: RegExp) =>
  expect(promise).rejects.toMatchObject({
    message: expect.stringMatching(pattern),
    extensions: { code: 'BAD_USER_INPUT' },
  });

const wideForm = (fields: number) =>
  Object.fromEntries(Array.from({ length: fields }, (_, i) => [`field${i}`, 'x']));

beforeEach(() => {
  sendFormEmail.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('what the public submission refuses', () => {
  it('refuses a form type nobody declared', async () => {
    await refusedWith(
      submit({ formType: 'quote', submissionData: {} }),
      /Unknown form type: quote/,
    );
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(0);
  });

  it('refuses a payload too large to be one of our forms', async () => {
    const message = 'x'.repeat(17 * 1024);
    await refusedWith(submit({ formType: 'contact', submissionData: { message } }), /too large/);
  });

  it('refuses more than fifty fields, and takes fifty', async () => {
    await refusedWith(
      submit({ formType: 'contact', submissionData: wideForm(51) }),
      /too many fields/,
    );
    await expect(
      submit({ formType: 'contact', submissionData: wideForm(50) }),
    ).resolves.toMatchObject({ status: 'new' });
  });

  it('refuses data nested more than one object deep, and takes one level', async () => {
    await refusedWith(
      submit({ formType: 'career', submissionData: { a: { b: { c: 1 } } } }),
      /nested too deeply/,
    );
    const created = await submit({
      formType: 'career',
      submissionData: { skills: ['TypeScript', 'Go'], address: { city: 'Pune' }, note: null },
    });
    const saved = await WebsiteSubmissionModel.findById(created.id).lean();
    expect(saved?.submissionData).toMatchObject({ skills: ['TypeScript', 'Go'] });
  });

  it('stops a visitor past the burst limit before the question is checked', async () => {
    jest.spyOn(submissionBurstLimiter, 'allow').mockResolvedValueOnce(false);

    await expect(submit({ formType: 'newsletter', submissionData: {} })).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(0);
  });

  it('stops a visitor past the daily limit too', async () => {
    jest.spyOn(submissionDailyLimiter, 'allow').mockResolvedValueOnce(false);

    await expect(submit({ formType: 'newsletter', submissionData: {} })).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
  });
});

describe('what the public submission stores', () => {
  it('files a new submission from the website unless the caller names its source', async () => {
    const plain = await submit({ formType: 'newsletter', submissionData: { email: 'a@b.co' } });
    const landing = await submit({
      formType: 'newsletter',
      submissionData: { email: 'c@d.co' },
      source: 'landing-page',
    });

    expect(plain).toMatchObject({ source: 'website', status: 'new', applicantId: null });
    expect(landing.source).toBe('landing-page');
  });

  it('counts a caller with no address under one shared key', async () => {
    const allow = jest.spyOn(submissionBurstLimiter, 'allow');

    await submit({ formType: 'newsletter', submissionData: {} }, { user: null });

    expect(allow).toHaveBeenCalledWith('unknown');
  });

  it('takes a submission sent without a data object as an empty one', async () => {
    const created = await submit({
      formType: 'newsletter',
      submissionData: undefined as unknown as Record<string, unknown>,
    });

    expect(created.status).toBe('new');
    expect(sendFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({ submissionData: {}, replyTo: undefined }),
    );
  });

  it('files a contact enquiry as a lead straight away', async () => {
    const created = await submit({
      formType: 'contact',
      submissionData: { name: 'Sam', email: 'sam@acme.test' },
    });

    const saved = await WebsiteSubmissionModel.findById(created.id).lean();
    expect(saved?.leadId).toEqual(expect.any(String));
  });

  it('files a job application as an applicant and links the two', async () => {
    const created = await submit({
      formType: 'job-application',
      submissionData: { firstName: 'Meera', lastName: 'Iyer', email: 'meera@example.com' },
    });

    expect(created.applicantId).toEqual(expect.any(String));
    const saved = await WebsiteSubmissionModel.findById(created.id).lean();
    expect(saved?.applicantId).toBe(created.applicantId);
  });

  it('keeps a job application whose applicant could not be filed, and logs why', async () => {
    jest
      .spyOn(recruitingService, 'createApplicantFromSubmission')
      .mockRejectedValueOnce(new Error('bad payload'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const created = await submit({
      formType: 'job-application',
      submissionData: { email: 'meera@example.com' },
    });

    expect(created.applicantId).toBeNull();
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(1);
    expect(logged).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('its applicant failed'),
    );
  });
});
