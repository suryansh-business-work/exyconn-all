import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { runAsPlatform } from '../../lib/tenant';
import { derivedKey } from '../../utils/derivedKey';
import { WebsiteCaptchaUseModel } from './models/captcha-use.model';

/** How long a question stays answerable. */
export const CAPTCHA_TTL_MS = 10 * 60 * 1000;
/** Each side of the sum: 1–20, so a blind guess lands about one time in forty. */
const MAX_TERM = 20;

export const CAPTCHA_FAILED = 'CAPTCHA_FAILED';
const FAILED_MESSAGE =
  'The security check answer was wrong or has expired. Please answer the new question.';

interface CaptchaBody {
  /** One-use id: an answered question cannot be answered again. */
  n: string;
  /** Expiry, epoch ms. */
  e: number;
}

const sign = (body: string, answer: number): Buffer =>
  createHmac('sha256', derivedKey('website-captcha')).update(`${body}.${answer}`).digest();

function fail(): never {
  throw new GraphQLError(FAILED_MESSAGE, { extensions: { code: CAPTCHA_FAILED } });
}

/**
 * A sum to answer, and a token that proves which sum it was. The answer is not in the token —
 * only a signature over it — so the browser cannot read it, and the server keeps no state until
 * the question is answered.
 */
export function issueCaptcha(now = Date.now()) {
  const a = randomInt(1, MAX_TERM + 1);
  const b = randomInt(1, MAX_TERM + 1);
  const payload: CaptchaBody = {
    n: randomBytes(16).toString('base64url'),
    e: now + CAPTCHA_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${body}.${sign(body, a + b).toString('base64url')}`, question: `${a} + ${b}` };
}

function parse(token: string): { body: string; mac: Buffer; payload: CaptchaBody } | null {
  const [body, mac, extra] = token.split('.');
  if (!body || !mac || extra !== undefined) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as CaptchaBody;
    if (typeof payload.n !== 'string' || typeof payload.e !== 'number') return null;
    return { body, mac: Buffer.from(mac, 'base64url'), payload };
  } catch {
    return null;
  }
}

/**
 * Refuses a submission whose question was not answered correctly, has expired, or was already
 * answered once. The question is spent BEFORE the answer is checked, so a wrong guess cannot be
 * followed by another on the same question: every try costs a fresh one.
 */
export async function assertCaptcha(
  token: string,
  answer: string,
  now = Date.now(),
): Promise<void> {
  const parsed = parse(token);
  if (!parsed || parsed.payload.e < now) fail();
  const { body, mac, payload } = parsed;
  // An atomic insert-if-new: `upsertedCount` says whether this is the question's first answer,
  // without waiting on the unique index being built.
  const spent = await runAsPlatform(() =>
    WebsiteCaptchaUseModel.updateOne(
      { nonce: payload.n },
      { $setOnInsert: { nonce: payload.n, expiresAt: new Date(payload.e) } },
      { upsert: true },
    ),
  );
  if (spent.upsertedCount !== 1) fail();
  const guess = Number.parseInt(answer.trim(), 10);
  const expected = sign(body, guess);
  if (Number.isNaN(guess) || expected.length !== mac.length || !timingSafeEqual(expected, mac)) {
    fail();
  }
}
