import { authService } from '../../src/modules/auth/auth.service';
import {
  startMfaEnrolment,
  confirmMfaEnrolment,
  verifySecondFactor,
} from '../../src/modules/auth/mfa.service';
import { SessionModel } from '../../src/modules/auth/session.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { totpCode, stepAt } from '../../src/utils/totp';
import { verifyToken } from '../../src/utils/jwt';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

const EMAIL = 'asha@exyconn.com';
const PASSWORD = 'correct-horse-42';

describe('a sign-in that did not arrive over HTTP', () => {
  it('records the session as coming from an unknown device', async () => {
    const user = await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);

    const result = await authService.issueSession(user);

    expect(verifyToken(result.token)?.id).toBe(user.id);
    const session = await SessionModel.findOne({ userId: user.id }).lean();
    expect(session).toMatchObject({ ip: 'unknown', userAgent: '' });
  });

  it('completes a two-factor sign-in the same way', async () => {
    const user = await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, totpCode(secret, stepAt(new Date())));
    const { mfaChallenge } = await authService.login(EMAIL, PASSWORD);

    const result = await authService.completeMfaSignIn(
      mfaChallenge,
      totpCode(secret, stepAt(new Date())),
    );

    expect(result.mfaRequired).toBe(false);
    const session = await SessionModel.findOne({ userId: user.id }).lean();
    expect(session).toMatchObject({ ip: 'unknown', userAgent: '' });
  });

  it('stamps token version 0 on an account that never had one', async () => {
    const user = await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
    await UserModel.collection.updateOne({ _id: user._id }, { $set: { tokenVersion: null } });

    const { token } = await authService.login(EMAIL, PASSWORD);

    expect(verifyToken(token)?.tv).toBe(0);
  });
});

describe('a second factor on an account with no recovery codes recorded', () => {
  it('refuses a code that is not the authenticator’s, instead of failing', async () => {
    const user = await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, totpCode(secret, stepAt(new Date())));
    await UserModel.collection.updateOne(
      { _id: user._id },
      { $unset: { 'mfa.recoveryCodes': '' } },
    );

    await expect(verifySecondFactor(user.id, '000000')).resolves.toBe(false);
    await expect(verifySecondFactor(user.id, totpCode(secret, stepAt(new Date())))).resolves.toBe(
      true,
    );
  });
});
