import { randomUUID } from 'node:crypto';
import { emailer } from '../../src/modules/email';
import { authResolvers } from '../../src/modules/auth/auth.resolvers';
import { resetIpLimiter, resetRequestLimiter } from '../../src/modules/auth/password-reset.service';
import { authService } from '../../src/modules/auth/auth.service';
import { AuditLogModel } from '../../src/modules/audit';
import { imageUploader } from '../../src/utils/imagekit';
import { totpCode, stepAt } from '../../src/utils/totp';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';
import ips from '../fixtures/ips.json';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const { Query, Mutation } = authResolvers;
const send = emailer.send as jest.Mock;
const PASSWORD = `pw-${randomUUID()}`;
const codeNow = (secret: string) => totpCode(secret, stepAt(new Date()));

let user: { id: string; email: string };
let ctx: GraphQLContext;

beforeEach(async () => {
  await Promise.all([resetRequestLimiter.reset(), resetIpLimiter.reset()]);
  const seeded = await seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.HR]);
  user = { id: seeded.id, email: seeded.email };
  ctx = { user: { id: user.id, email: user.email, roles: [ROLES.HR] }, ip: ips.ip10_2_2_2 };
});

afterEach(() => jest.restoreAllMocks());

const auditSummaries = async () =>
  (await AuditLogModel.find({ module: 'Auth', entityId: user.id }).sort({ _id: 1 }).lean()).map(
    (row) => row.summary,
  );

describe('two-factor through the API', () => {
  it('enrols, confirms and switches off, auditing both switches', async () => {
    await expect(Query.myMfaStatus(null, {}, ctx)).resolves.toMatchObject({ enabled: false });

    const { secret, uri } = await Mutation.startMfaEnrolment(null, {}, ctx);
    expect(uri).toContain('otpauth://totp/');

    const codes = await Mutation.confirmMfaEnrolment(null, { code: codeNow(secret) }, ctx);
    expect(codes).toHaveLength(10);
    await expect(Query.myMfaStatus(null, {}, ctx)).resolves.toMatchObject({ enabled: true });

    await expect(Mutation.disableMfa(null, { password: PASSWORD }, ctx)).resolves.toBe(true);
    expect(await auditSummaries()).toEqual([
      'Switched two-factor authentication on',
      'Switched two-factor authentication off',
    ]);
  });

  it('audits nothing when a switch is refused', async () => {
    await Mutation.startMfaEnrolment(null, {}, ctx);

    await expect(Mutation.confirmMfaEnrolment(null, { code: 'nope' }, ctx)).rejects.toThrow(
      'not right',
    );
    await expect(Mutation.disableMfa(null, { password: 'wrong-password' }, ctx)).rejects.toThrow(
      'That password is not right.',
    );
    expect(await auditSummaries()).toEqual([]);
  });

  it('refuses every two-factor call without a signed-in user', async () => {
    const anonymous: GraphQLContext = { user: null };

    await expect(Query.myMfaStatus(null, {}, anonymous)).rejects.toThrow('Authentication required');
    await expect(Mutation.startMfaEnrolment(null, {}, anonymous)).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('the caller s own account through the API', () => {
  it('updates the profile and hands it back with an id', async () => {
    const saved = await Mutation.updateProfile(null, { input: { name: 'Hana Ito' } }, ctx);

    expect(saved).toMatchObject({ id: user.id, name: 'Hana Ito' });
  });

  it('changes the password and audits it', async () => {
    const next = `next-${randomUUID()}`;

    await expect(
      Mutation.changePassword(null, { currentPassword: PASSWORD, newPassword: next }, ctx),
    ).resolves.toBe(true);

    expect(await auditSummaries()).toEqual(['Changed own password']);
    await expect(authService.login(user.email, next)).resolves.toHaveProperty('token');
  });

  it('audits no password change that was refused', async () => {
    await expect(
      Mutation.changePassword(
        null,
        { currentPassword: 'not-it', newPassword: `n-${randomUUID()}` },
        ctx,
      ),
    ).rejects.toThrow('Current password is incorrect');
    expect(await auditSummaries()).toEqual([]);
  });

  it('uploads the caller s avatar under their own id', async () => {
    const upload = jest
      .spyOn(imageUploader, 'uploadAvatar')
      .mockResolvedValue('https://ik.imagekit.io/exy/me.png');

    await expect(
      Mutation.uploadAvatar(null, { file: 'data:image/png;base64,AA' }, ctx),
    ).resolves.toBe('https://ik.imagekit.io/exy/me.png');
    expect(upload).toHaveBeenCalledWith('data:image/png;base64,AA', `avatar-${user.id}`);
  });
});

describe('the unauthenticated recovery mutations', () => {
  it('re-issues nothing while an administrator exists', async () => {
    await seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.ADMIN]);

    await expect(Mutation.sendAdminCredentials()).resolves.toMatch(/already exists/);
  });

  it('emails a reset link and sets the new password from it', async () => {
    const anonymous: GraphQLContext = { user: null, ip: ips.ip10_3_3_3 };
    const next = `reset-${randomUUID()}`;

    await expect(
      Mutation.requestPasswordReset(null, { email: user.email }, anonymous),
    ).resolves.toBe(true);
    const link: string = send.mock.calls[0][0].variables.link;
    const token = new URL(link).searchParams.get('token') ?? '';

    await expect(
      Mutation.resetPassword(null, { token, newPassword: next }, anonymous),
    ).resolves.toBe(true);
    await expect(authService.login(user.email, next)).resolves.toHaveProperty('token');
  });
});
