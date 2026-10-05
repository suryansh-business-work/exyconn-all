import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { derivedKey } from '../../utils/derivedKey';
import { badRequest } from '../../utils/errors';
import { EmailCodeModel } from './emailCode.model';

/** Long enough to switch to the inbox and back; short enough that an old email is worthless. */
const CODE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_CODE_TTL_LABEL = '10 minutes';
/** Wrong guesses one code survives: a million codes against five guesses is not a search. */
const MAX_ATTEMPTS = 5;
const CODE_DIGITS = 6;

/** Which sign-in a code belongs to; a code for one never opens the other. */
export type EmailCodePurpose = 'whatsapp-demo' | 'client-hub' | 'website-chat';

const hashOf = (purpose: EmailCodePurpose, email: string, code: string): string =>
  createHmac('sha256', derivedKey(`email-code:${purpose}`))
    .update(`${email}:${code}`)
    .digest('hex');

/**
 * Spends any code sent to the address before and issues a fresh one. Returns the code for the
 * caller's email; only its hash is kept. Runs in the scope of the company the sign-in is for.
 */
export async function issueEmailCode(purpose: EmailCodePurpose, email: string): Promise<string> {
  await EmailCodeModel.updateMany({ purpose, email, usedAt: null }, { usedAt: new Date() });
  const code = String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, '0');
  await EmailCodeModel.create({
    purpose,
    email,
    codeHash: hashOf(purpose, email, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

/**
 * Checks a code against the newest one sent to the address and spends it. Every wrong guess
 * counts against the code; refuses with a sentence the person can act on.
 */
export async function consumeEmailCode(
  purpose: EmailCodePurpose,
  email: string,
  code: string,
): Promise<void> {
  const row = await EmailCodeModel.findOne({
    purpose,
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
    await EmailCodeModel.updateOne({ _id: row._id }, { usedAt: new Date() });
    badRequest('Too many wrong codes. Ask for a new one.');
  }
  const expected = Buffer.from(row.codeHash, 'hex');
  const given = Buffer.from(hashOf(purpose, email, code.trim()), 'hex');
  if (!timingSafeEqual(expected, given)) {
    await EmailCodeModel.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
    badRequest('That code is not right.');
  }
  const spent = await EmailCodeModel.findOneAndUpdate(
    { _id: row._id, usedAt: null },
    { usedAt: new Date() },
  );
  if (!spent) {
    badRequest('That code has already been used. Ask for a new one.');
  }
}
