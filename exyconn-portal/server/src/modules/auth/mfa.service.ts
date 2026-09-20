import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { UserModel } from '../admin/user.model';
import { seal, open } from '../../utils/secretBox';
import { generateTotpSecret, totpUri, verifyTotp } from '../../utils/totp';
import { verifyPassword } from '../../utils/password';
import { badRequest, notFound, unauthenticated } from '../../utils/errors';
import { runAsPlatform } from '../../lib/tenant';

/** How many one-use codes a person is given to get back in without their phone. */
const RECOVERY_CODE_COUNT = 10;
/** The name an authenticator app files the account under. */
const ISSUER = 'Exyconn';

/**
 * Recovery codes are hashed, not sealed.
 *
 * A sealed secret has to be readable again to check a TOTP code; a recovery code never
 * does — it is only ever compared. SHA-256 rather than argon2 because the code is 20 random
 * base32 characters, which no amount of guessing gets through, and sign-in should not pay
 * for a memory-hard hash on a code somebody uses twice a decade.
 */
const hashRecoveryCode = (code: string): string =>
  createHash('sha256').update(code.toUpperCase().replaceAll('-', '')).digest('hex');

function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = randomBytes(10).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}`;
  });
}

/** `+mfa` because the field is `select: false`: nothing reads it by accident. */
const userFor = async (userId: string) => {
  const user = await runAsPlatform(() => UserModel.findById(userId).select('+mfa'));
  if (!user) {
    notFound('User');
  }
  return user;
};

/**
 * Begins enrolment: mints a secret and hands back the URI for the QR code.
 *
 * Nothing is switched on yet, and the secret is stored unconfirmed — somebody who closes the
 * page halfway through has not locked themselves out, and the next attempt starts fresh.
 */
export async function startMfaEnrolment(userId: string) {
  const user = await userFor(userId);
  if (user.mfa?.enabled) {
    badRequest('Two-factor authentication is already on for this account.');
  }
  const secret = generateTotpSecret();
  user.set('mfa', { enabled: false, secret: seal(secret), recoveryCodes: [], enrolledAt: null });
  await user.save();
  return {
    secret,
    uri: totpUri({ secret, account: user.email, issuer: ISSUER }),
  };
}

/**
 * Finishes enrolment once the person has typed a code their app produced.
 *
 * The code is proof that the secret actually reached the app: switching two-factor on
 * without it is how somebody locks themselves out of their own account by scanning nothing.
 * The recovery codes are returned here and never again — they are stored hashed.
 */
export async function confirmMfaEnrolment(userId: string, code: string): Promise<string[]> {
  const user = await userFor(userId);
  const sealed = user.mfa?.secret;
  if (!sealed || user.mfa?.enabled) {
    badRequest('Start setting up two-factor authentication before confirming it.');
  }
  if (!verifyTotp(open(sealed), code)) {
    badRequest('That code is not right. Check your authenticator app and try the next one.');
  }
  const codes = generateRecoveryCodes();
  user.set('mfa', {
    enabled: true,
    secret: sealed,
    recoveryCodes: codes.map(hashRecoveryCode),
    enrolledAt: new Date(),
  });
  await user.save();
  return codes;
}

/** Switches two-factor off, which needs the password — a borrowed screen must not be enough. */
export async function disableMfa(userId: string, password: string): Promise<boolean> {
  const user = await userFor(userId);
  if (!(await verifyPassword(password, user.passwordHash))) {
    unauthenticated('That password is not right.');
  }
  user.set('mfa', { enabled: false, secret: '', recoveryCodes: [], enrolledAt: null });
  await user.save();
  return true;
}

/** Whether two-factor is on, and how many recovery codes are left, for the settings screen. */
export async function mfaStatus(userId: string) {
  const user = await userFor(userId);
  return {
    enabled: Boolean(user.mfa?.enabled),
    recoveryCodesLeft: user.mfa?.recoveryCodes?.length ?? 0,
    enrolledAt: user.mfa?.enrolledAt ?? null,
  };
}

/** Whether this account asks for a second factor at sign-in. */
export async function mfaIsOn(userId: string): Promise<boolean> {
  const user = await runAsPlatform(() =>
    UserModel.findById(userId).select('+mfa').select('mfa').lean(),
  );
  return Boolean(user?.mfa?.enabled);
}

/**
 * Checks a second factor at sign-in: an authenticator code, or one of the recovery codes.
 *
 * A recovery code is spent the moment it works. That is the whole point of it being a
 * recovery code, and it means a list somebody photographed is worth less every time it is
 * used.
 */
export async function verifySecondFactor(userId: string, code: string): Promise<boolean> {
  const user = await userFor(userId);
  const sealed = user.mfa?.secret;
  if (!user.mfa?.enabled || !sealed) {
    return false;
  }
  if (verifyTotp(open(sealed), code)) {
    return true;
  }
  const typed = hashRecoveryCode(code);
  const match = (user.mfa.recoveryCodes ?? []).find((stored) => {
    const a = Buffer.from(stored);
    const b = Buffer.from(typed);
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (!match) {
    return false;
  }
  await runAsPlatform(() =>
    UserModel.updateOne({ _id: userId }, { $pull: { 'mfa.recoveryCodes': match } }),
  );
  return true;
}
