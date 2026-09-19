import { authService } from '../../src/modules/auth/auth.service';
import {
  startMfaEnrolment,
  confirmMfaEnrolment,
  disableMfa,
  mfaStatus,
} from '../../src/modules/auth/mfa.service';
import { listSessions, revokeSession } from '../../src/modules/auth/session.service';
import { SessionModel } from '../../src/modules/auth/session.model';
import { totpCode, stepAt, verifyTotp, totpUri, decodeBase32 } from '../../src/utils/totp';
import { verifyToken } from '../../src/utils/jwt';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

const EMAIL = 'asha@exyconn.com';
const PASSWORD = 'correct-horse-42';
const FROM = { ip: '198.51.100.7', userAgent: 'Mozilla/5.0 (Macintosh) Chrome/141' };

const codeNow = (secret: string) => totpCode(secret, stepAt(new Date()));

async function signedInUser() {
  return seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
}

describe('time-based one-time passwords', () => {
  const SECRET = 'JBSWY3DPEHPK3PXP';

  it('produces the code RFC 4238 says it should', () => {
    // The vector every implementation is checked against: the ASCII secret "12345678901234567890"
    // at 1970-01-01T00:00:59Z, one step in.
    const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    expect(decodeBase32(rfcSecret).toString('utf8')).toBe('12345678901234567890');
    expect(totpCode(rfcSecret, 1)).toBe('287082');
  });

  it('takes the code before and after, for a phone whose clock is a little out', () => {
    const now = new Date('2026-09-20T09:00:00Z');
    const step = stepAt(now);

    expect(verifyTotp(SECRET, totpCode(SECRET, step), now)).toBe(true);
    expect(verifyTotp(SECRET, totpCode(SECRET, step - 1), now)).toBe(true);
    expect(verifyTotp(SECRET, totpCode(SECRET, step + 1), now)).toBe(true);
  });

  it('refuses a code from two steps ago, and anything the wrong shape', () => {
    const now = new Date('2026-09-20T09:00:00Z');

    expect(verifyTotp(SECRET, totpCode(SECRET, stepAt(now) - 3), now)).toBe(false);
    expect(verifyTotp(SECRET, '12345', now)).toBe(false);
    expect(verifyTotp(SECRET, '', now)).toBe(false);
  });

  it('writes a URI an authenticator app can read', () => {
    const uri = totpUri({ secret: SECRET, account: EMAIL, issuer: 'Exyconn' });

    expect(uri.startsWith('otpauth://totp/Exyconn%3Aasha%40exyconn.com?')).toBe(true);
    expect(uri).toContain(`secret=${SECRET}`);
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });
});

describe('turning two-factor on', () => {
  it('does not switch on until a code proves the secret arrived', async () => {
    const user = await signedInUser();
    const { secret } = await startMfaEnrolment(user.id);

    await expect(confirmMfaEnrolment(user.id, '000000')).rejects.toThrow('not right');
    expect(await mfaStatus(user.id)).toMatchObject({ enabled: false });

    const codes = await confirmMfaEnrolment(user.id, codeNow(secret));

    expect(codes).toHaveLength(10);
    expect(await mfaStatus(user.id)).toMatchObject({ enabled: true, recoveryCodesLeft: 10 });
  });

  it('will not switch off without the password', async () => {
    const user = await signedInUser();
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, codeNow(secret));

    await expect(disableMfa(user.id, 'not-the-password')).rejects.toThrow('not right');
    expect(await disableMfa(user.id, PASSWORD)).toBe(true);
    expect(await mfaStatus(user.id)).toMatchObject({ enabled: false });
  });
});

describe('signing in with two factors', () => {
  it('gives a challenge instead of a session, and says nothing about the account', async () => {
    const user = await signedInUser();
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, codeNow(secret));

    const attempt = await authService.login(EMAIL, PASSWORD, FROM);

    expect(attempt).toMatchObject({ mfaRequired: true, token: '', user: null });
    expect(attempt.mfaChallenge).not.toBe('');
    expect(await SessionModel.countDocuments()).toBe(0);
  });

  it('issues the session once the code is given', async () => {
    const user = await signedInUser();
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, codeNow(secret));
    const { mfaChallenge } = await authService.login(EMAIL, PASSWORD, FROM);

    const result = await authService.completeMfaSignIn(mfaChallenge, codeNow(secret), FROM);

    expect(result.mfaRequired).toBe(false);
    expect(verifyToken(result.token)?.id).toBe(user.id);
    expect(await SessionModel.countDocuments()).toBe(1);
  });

  it('refuses a wrong code, and a challenge that is not one', async () => {
    const user = await signedInUser();
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, codeNow(secret));
    const { mfaChallenge } = await authService.login(EMAIL, PASSWORD, FROM);

    await expect(authService.completeMfaSignIn(mfaChallenge, '000000', FROM)).rejects.toThrow(
      'not right',
    );
    await expect(authService.completeMfaSignIn('not-a-token', '000000', FROM)).rejects.toThrow(
      'expired',
    );
  });

  it('spends a recovery code the first time it is used', async () => {
    const user = await signedInUser();
    const { secret } = await startMfaEnrolment(user.id);
    const [recovery] = await confirmMfaEnrolment(user.id, codeNow(secret));
    const first = await authService.login(EMAIL, PASSWORD, FROM);

    const result = await authService.completeMfaSignIn(first.mfaChallenge, recovery, FROM);
    expect(result.token).not.toBe('');
    expect(await mfaStatus(user.id)).toMatchObject({ recoveryCodesLeft: 9 });

    const second = await authService.login(EMAIL, PASSWORD, FROM);
    await expect(
      authService.completeMfaSignIn(second.mfaChallenge, recovery, FROM),
    ).rejects.toThrow('not right');
  });
});

describe('the sessions a person can see', () => {
  it('records the device that signed in, and marks the current one', async () => {
    const user = await signedInUser();
    const { token } = await authService.login(EMAIL, PASSWORD, FROM);
    const sid = verifyToken(token)?.sid;

    const sessions = await listSessions(user.id, sid);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      ip: FROM.ip,
      userAgent: FROM.userAgent,
      current: true,
    });
  });

  it('ends one device without touching the others', async () => {
    const user = await signedInUser();
    const laptop = await authService.login(EMAIL, PASSWORD, FROM);
    const phone = await authService.login(EMAIL, PASSWORD, { ip: '203.0.113.9', userAgent: 'iOS' });
    const phoneSid = verifyToken(phone.token)?.sid ?? '';

    await revokeSession(user.id, phoneSid);
    const left = await listSessions(user.id, verifyToken(laptop.token)?.sid);

    expect(left).toHaveLength(1);
    expect(left[0].userAgent).toBe(FROM.userAgent);
  });

  it('ends every session when the password changes', async () => {
    const user = await signedInUser();
    await authService.login(EMAIL, PASSWORD, FROM);
    await authService.login(EMAIL, PASSWORD, { ip: '203.0.113.9', userAgent: 'iOS' });

    await authService.changePassword(user.id, PASSWORD, 'a-brand-new-password-1');

    expect(await listSessions(user.id, undefined)).toEqual([]);
  });
});
