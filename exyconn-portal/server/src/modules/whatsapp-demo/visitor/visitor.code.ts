import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { createLimiter, tooManyRequests } from '../../../lib/rateLimiter';
import { assertCaptcha } from '../../website/website.captcha';
import { runForOrganization } from '../../../lib/tenant';
import { platformOperatorOrganizationId } from '../../../lib/platformAccess';
import { derivedKey } from '../../../utils/derivedKey';
import { isEmailAddress } from '../../../utils/emailAddress';
import { badRequest } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { env } from '../../../config/env';
import { emailer } from '../../email/email.service';
import { WhatsappDemoVisitorModel, type VisitorSource } from './visitor.model';
import { WhatsappDemoVisitorCodeModel } from './visitor-code.model';
import { signVisitorPass } from './visitor.token';

/** Long enough to switch to the inbox and back; short enough that an old email is worthless. */
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_TTL_LABEL = '10 minutes';
/** Wrong guesses one code survives; a million codes against five guesses is not a search. */
const MAX_ATTEMPTS = 5;
const CODE_DIGITS = 6;
/** The same phone shape as @exyconn/regex PHONE, which the forms check first. */
const PHONE = /^\+?\(?\d[\d\s()-]{5,18}\d$/;
const LIMITS = { name: 120, company: 120 } as const;
const LINK_LIKE = /[@/]|www\.|\.(?:com|net|org|io|ru|xyz)\b/i;

/**
 * Nobody is mail-bombed through the demo: five codes an hour per address, whoever asks.
 *
 * The demo's own sign-in calls the API from the visitor's browser, so its requests are also
 * limited per network. The website asks from its own server — one address for every visitor —
 * so it answers the website's security question instead, under a flood backstop sized for that
 * one caller (as website form submissions are).
 */
const codeAddressLimiter = createLimiter({
  keyPrefix: 'wa_demo_code_address',
  points: 5,
  durationSec: 60 * 60,
});
const codeIpLimiter = createLimiter({
  keyPrefix: 'wa_demo_code_ip',
  points: 20,
  durationSec: 60 * 60,
});
const codeWebsiteLimiter = createLimiter({
  keyPrefix: 'wa_demo_code_website',
  points: 120,
  durationSec: 10 * 60,
});
/** Guesses per address, across codes: on top of each code's own five, whoever is guessing. */
const verifyAddressLimiter = createLimiter({
  keyPrefix: 'wa_demo_verify_address',
  points: 15,
  durationSec: 15 * 60,
});

/** The website's security question, answered (see website.captcha.ts). */
export interface CaptchaAnswer {
  token: string;
  answer: string;
}

export interface VisitorCodeInput {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  source: VisitorSource;
}

const codeHash = (email: string, code: string): string =>
  createHmac('sha256', derivedKey('whatsapp-demo-code')).update(`${email}:${code}`).digest('hex');

const normalEmail = (email: string): string => email.trim().toLowerCase();

async function throttle(limiter: typeof codeIpLimiter, key: string, what: string): Promise<void> {
  if (!(await limiter.allow(key))) {
    tooManyRequests(await limiter.retryAfterMs(key), what);
  }
}

/** The company the demos and their visitors belong to: the one that runs the website. */
async function demoOwner(): Promise<string> {
  const operatorId = await platformOperatorOrganizationId();
  if (operatorId === null) {
    badRequest('The live demo is not available yet.');
  }
  return operatorId;
}

function validate(input: VisitorCodeInput): void {
  const name = input.name.trim();
  if (name === '' || name.length > LIMITS.name) {
    badRequest('Enter your name.');
  }
  // The name is printed in an email to the address given: never a link or an address in it.
  if (LINK_LIKE.test(name)) {
    badRequest('Enter your name without links or email addresses.');
  }
  if (!isEmailAddress(normalEmail(input.email))) {
    badRequest('Enter a valid email address.');
  }
  if ((input.company ?? '').trim().length > LIMITS.company) {
    badRequest(`Keep the company name under ${LIMITS.company} characters.`);
  }
  const phone = (input.phone ?? '').trim();
  if (phone !== '' && !PHONE.test(phone)) {
    badRequest('Enter a valid phone number.');
  }
}

/** The visitor's details as given; blank optional fields leave what was stored before. */
function profileUpdate(input: VisitorCodeInput) {
  const set: Record<string, string> = { name: input.name.trim() };
  const company = (input.company ?? '').trim();
  const phone = (input.phone ?? '').trim();
  if (company !== '') set.company = company;
  if (phone !== '') set.phone = phone;
  return set;
}

/**
 * Files the visitor as a lead and emails them a fresh sign-in code (the "thank you for your
 * live demo" email). Any code sent before is spent. A blocked visitor is told the same as
 * anybody else, and sent nothing.
 */
export async function requestVisitorCode(
  input: VisitorCodeInput,
  ip: string,
  captcha: CaptchaAnswer | null,
): Promise<boolean> {
  validate(input);
  const email = normalEmail(input.email);
  if (captcha) {
    await throttle(codeWebsiteLimiter, 'website', 'code requests');
    await assertCaptcha(captcha.token, captcha.answer);
  } else {
    await throttle(codeIpLimiter, ip, 'code requests');
  }
  await throttle(codeAddressLimiter, email, 'codes for this address');
  const operatorId = await demoOwner();

  await runForOrganization(operatorId, async () => {
    const visitor = await WhatsappDemoVisitorModel.findOneAndUpdate(
      { email },
      { $set: profileUpdate(input), $setOnInsert: { email, source: input.source } },
      { upsert: true, new: true },
    ).lean();
    if (visitor.blocked) {
      return;
    }
    await WhatsappDemoVisitorCodeModel.updateMany({ email, usedAt: null }, { usedAt: new Date() });
    const code = String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, '0');
    await WhatsappDemoVisitorCodeModel.create({
      email,
      codeHash: codeHash(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    try {
      await emailer.send({
        template: 'whatsapp-demo-code',
        to: email,
        variables: {
          name: visitor.name,
          code,
          expiresIn: CODE_TTL_LABEL,
          demoUrl: env.whatsappDemoUrl,
        },
        triggeredBy: 'WhatsApp demo sign-in',
      });
    } catch (error) {
      logger.error({ err: error }, 'WhatsApp demo code email failed');
      badRequest('We could not send the code just now. Try again in a minute.');
    }
  });
  return true;
}

/** Checks a code against the newest one sent to the address, spending a guess either way. */
async function consumeCode(email: string, code: string): Promise<void> {
  const row = await WhatsappDemoVisitorCodeModel.findOne({
    email,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!row) {
    badRequest('That code has expired. Ask for a new one.');
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await WhatsappDemoVisitorCodeModel.updateOne({ _id: row._id }, { usedAt: new Date() });
    badRequest('Too many wrong codes. Ask for a new one.');
  }
  const expected = Buffer.from(row.codeHash, 'hex');
  const given = Buffer.from(codeHash(email, code.trim()), 'hex');
  if (!timingSafeEqual(expected, given)) {
    await WhatsappDemoVisitorCodeModel.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
    badRequest('That code is not right.');
  }
  const spent = await WhatsappDemoVisitorCodeModel.findOneAndUpdate(
    { _id: row._id, usedAt: null },
    { usedAt: new Date() },
  );
  if (!spent) {
    badRequest('That code has already been used. Ask for a new one.');
  }
}

/** Signs a visitor in with the code from their email, and hands back their demo pass. */
export async function verifyVisitorCode(rawEmail: string, code: string) {
  const email = normalEmail(rawEmail);
  await throttle(verifyAddressLimiter, email, 'code attempts');
  const operatorId = await demoOwner();
  return runForOrganization(operatorId, async () => {
    await consumeCode(email, code);
    const now = new Date();
    const visitor = await WhatsappDemoVisitorModel.findOneAndUpdate(
      { email },
      { $set: { lastSignInAt: now }, $inc: { signInCount: 1 } },
      { new: true },
    ).lean();
    if (!visitor || visitor.blocked) {
      badRequest('Demo access for this address has been switched off.');
    }
    if (!visitor.verifiedAt) {
      await WhatsappDemoVisitorModel.updateOne({ _id: visitor._id }, { verifiedAt: now });
    }
    return {
      token: signVisitorPass(String(visitor._id), visitor.tokenVersion),
      visitor: { ...visitor, verifiedAt: visitor.verifiedAt ?? now },
      demoUrl: env.whatsappDemoUrl,
    };
  });
}
