import { websiteResolvers } from '../../src/modules/website';
import { WebsiteSubmissionModel } from '../../src/modules/website/models';
import {
  CAPTCHA_FAILED,
  CAPTCHA_TTL_MS,
  assertCaptcha,
  issueCaptcha,
} from '../../src/modules/website/website.captcha';
import type { GraphQLContext } from '../../src/middleware/auth';
import { solvedCaptcha, useTestOrganization } from '../helpers';

useTestOrganization();

const answerOf = (question: string) => {
  const [a, b] = question.split(' + ').map(Number);
  return String(a + b);
};

/** What a refusal looks like to the website: its own code, so it can draw a new question. */
const refused = (promise: Promise<unknown>) =>
  expect(promise).rejects.toMatchObject({ extensions: { code: CAPTCHA_FAILED } });

describe('website captcha', () => {
  it('asks a sum of two numbers from 1 to 20, and keeps the answer out of the token', () => {
    const { token, question } = issueCaptcha();
    expect(question).toMatch(/^([1-9]|1\d|20) \+ ([1-9]|1\d|20)$/);
    const body = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
    expect(Object.keys(body).sort((a, b) => a.localeCompare(b))).toEqual(['e', 'n']);
  });

  it('accepts the right answer, with spaces around it', async () => {
    const { token, question } = issueCaptcha();
    await expect(assertCaptcha(token, ` ${answerOf(question)} `)).resolves.toBeUndefined();
  });

  it('refuses a wrong answer, and spends the question on it', async () => {
    const { token, question } = issueCaptcha();
    await refused(assertCaptcha(token, String(Number(answerOf(question)) + 1)));
    await refused(assertCaptcha(token, answerOf(question)));
  });

  it('refuses a question answered twice', async () => {
    const { token, question } = issueCaptcha();
    await assertCaptcha(token, answerOf(question));
    await refused(assertCaptcha(token, answerOf(question)));
  });

  it('refuses an expired question', async () => {
    const issuedAt = Date.now() - CAPTCHA_TTL_MS - 1;
    const { token, question } = issueCaptcha(issuedAt);
    await refused(assertCaptcha(token, answerOf(question)));
  });

  it('refuses a token that was tampered with or made up', async () => {
    const { token, question } = issueCaptcha();
    const [body] = token.split('.');
    await refused(assertCaptcha(`${body}.forged`, answerOf(question)));
    await refused(assertCaptcha('not-a-token', '3'));
    await refused(assertCaptcha(`${Buffer.from('{"n":1}').toString('base64url')}.x`, '3'));
    await refused(assertCaptcha('%%%.x', '3'));
    await refused(assertCaptcha(`${token}.extra`, answerOf(question)));
    await refused(assertCaptcha(issueCaptcha().token, 'seven'));
  });
});

describe('the public submission', () => {
  const visitor = { user: null, ip: '198.51.100.77' } as GraphQLContext;
  const Q = websiteResolvers.Query as unknown as Record<
    string,
    () => { token: string; question: string }
  >;
  const create = (captcha: { token: string; answer: string }) =>
    websiteResolvers.Mutation.createWebsiteSubmission(
      null,
      { input: { formType: 'newsletter', submissionData: { email: 'a@b.co' } }, captcha },
      visitor,
    );

  it('hands out a question from the public query', () => {
    expect(Q.websiteCaptcha().question).toContain(' + ');
  });

  it('is stored with the right answer, and refused without one', async () => {
    await create(solvedCaptcha());
    await refused(create({ token: issueCaptcha().token, answer: '0' }));
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(1);
  });
});
