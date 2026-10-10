import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  confirmMfaEnrolment,
  mfaIsOn,
  mfaStatus,
  startMfaEnrolment,
  verifySecondFactor,
} from '../../src/modules/auth/mfa.service';
import { totpCode, stepAt } from '../../src/utils/totp';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

const PASSWORD = `pw-${randomUUID()}`;
const codeNow = (secret: string) => totpCode(secret, stepAt(new Date()));
const nobody = () => new Types.ObjectId().toHexString();

const person = () => seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.EMPLOYEE]);

async function enrolled() {
  const user = await person();
  const { secret } = await startMfaEnrolment(user.id);
  const codes = await confirmMfaEnrolment(user.id, codeNow(secret));
  return { user, secret, codes };
}

describe('two-factor for an account that is not there', () => {
  it('refuses to start or report on it', async () => {
    await expect(startMfaEnrolment(nobody())).rejects.toThrow('User not found');
    await expect(mfaStatus(nobody())).rejects.toThrow('User not found');
  });

  it('never asks it for a second factor', async () => {
    await expect(mfaIsOn(nobody())).resolves.toBe(false);
  });
});

describe('an account that has never set two-factor up', () => {
  it('reports it off, with nothing to recover with', async () => {
    const user = await person();

    await expect(mfaStatus(user.id)).resolves.toEqual({
      enabled: false,
      recoveryCodesLeft: 0,
      enrolledAt: null,
    });
    await expect(mfaIsOn(user.id)).resolves.toBe(false);
  });

  it('cannot be confirmed before enrolment starts', async () => {
    const user = await person();

    await expect(confirmMfaEnrolment(user.id, '123456')).rejects.toThrow(
      'Start setting up two-factor authentication before confirming it.',
    );
  });

  it('accepts no second factor at all', async () => {
    const user = await person();

    await expect(verifySecondFactor(user.id, '123456')).resolves.toBe(false);
  });

  it('accepts no second factor half-way through enrolment either', async () => {
    const user = await person();
    const { secret } = await startMfaEnrolment(user.id);

    await expect(verifySecondFactor(user.id, codeNow(secret))).resolves.toBe(false);
    await expect(mfaIsOn(user.id)).resolves.toBe(false);
  });

  it('starts afresh when enrolment is begun again', async () => {
    const user = await person();
    const first = await startMfaEnrolment(user.id);
    const second = await startMfaEnrolment(user.id);

    expect(second.secret).not.toBe(first.secret);
    expect(second.uri).toContain(`secret=${second.secret}`);
    // Only the latest secret can finish the job.
    await expect(confirmMfaEnrolment(user.id, codeNow(second.secret))).resolves.toHaveLength(10);
  });
});

describe('an account with two-factor on', () => {
  it('refuses to enrol or confirm a second time', async () => {
    const { user, secret } = await enrolled();

    await expect(startMfaEnrolment(user.id)).rejects.toThrow('already on');
    await expect(confirmMfaEnrolment(user.id, codeNow(secret))).rejects.toThrow(
      'Start setting up two-factor authentication before confirming it.',
    );
  });

  it('reports when it was switched on', async () => {
    const { user } = await enrolled();

    const status = await mfaStatus(user.id);

    expect(status.enabled).toBe(true);
    expect(status.enrolledAt).toBeInstanceOf(Date);
    await expect(mfaIsOn(user.id)).resolves.toBe(true);
  });

  it('hands out ten distinct recovery codes in groups of five', async () => {
    const { codes } = await enrolled();

    expect(new Set(codes).size).toBe(10);
    expect(codes.every((code) => /^[\dA-F]{5}-[\dA-F]{5}-[\dA-F]{5}$/.test(code))).toBe(true);
  });

  it('takes a recovery code typed in lower case without its dashes', async () => {
    const { user, codes } = await enrolled();

    await expect(
      verifySecondFactor(user.id, codes[3].replaceAll('-', '').toLowerCase()),
    ).resolves.toBe(true);
    await expect(mfaStatus(user.id)).resolves.toMatchObject({ recoveryCodesLeft: 9 });
  });

  it('refuses a code that is neither the current one nor a recovery code', async () => {
    const { user } = await enrolled();

    await expect(verifySecondFactor(user.id, 'AAAAA-BBBBB-CCCCC')).resolves.toBe(false);
    await expect(mfaStatus(user.id)).resolves.toMatchObject({ recoveryCodesLeft: 10 });
  });
});
