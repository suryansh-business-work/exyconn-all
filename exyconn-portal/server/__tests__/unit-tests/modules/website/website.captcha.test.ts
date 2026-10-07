import {
  CAPTCHA_FAILED,
  CAPTCHA_TTL_MS,
  assertCaptcha,
  issueCaptcha,
} from '../../../../src/modules/website/website.captcha';
import { WebsiteCaptchaUseModel } from '../../../../src/modules/website/models/captcha-use.model';

const answerOf = (question: string) => {
  const [a, b] = question.split(' + ').map(Number);
  return String(a + b);
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const refused = (promise: Promise<unknown>) =>
  expect(promise).rejects.toMatchObject({ extensions: { code: CAPTCHA_FAILED } });

describe('website captcha, at the edges', () => {
  it('reads the clock it is handed, so a question lasts exactly its ten minutes', async () => {
    const issuedAt = Date.UTC(2026, 0, 1);
    const onTime = issueCaptcha(issuedAt);
    const late = issueCaptcha(issuedAt);

    await expect(
      assertCaptcha(onTime.token, answerOf(onTime.question), issuedAt + CAPTCHA_TTL_MS),
    ).resolves.toBeUndefined();
    await refused(
      assertCaptcha(late.token, answerOf(late.question), issuedAt + CAPTCHA_TTL_MS + 1),
    );
  });

  it('remembers an answered question until it would have expired', async () => {
    const issuedAt = Date.now();
    const { token, question } = issueCaptcha(issuedAt);

    await assertCaptcha(token, answerOf(question));

    const spent = await WebsiteCaptchaUseModel.find().lean();
    expect(spent).toHaveLength(1);
    expect(spent[0].expiresAt.getTime()).toBe(issuedAt + CAPTCHA_TTL_MS);
  });

  it('refuses a token whose expiry is not a number', async () => {
    await refused(assertCaptcha(`${encode({ n: 'abc', e: 'soon' })}.mac`, '2'));
    expect(await WebsiteCaptchaUseModel.countDocuments()).toBe(0);
  });

  it('refuses a token with nothing on either side of the dot', async () => {
    const { token } = issueCaptcha();
    await refused(assertCaptcha(`${token.split('.')[0]}.`, '2'));
    await refused(assertCaptcha('.mac', '2'));
  });

  it('refuses an empty answer', async () => {
    await refused(assertCaptcha(issueCaptcha().token, '   '));
  });
});
