import { randomUUID } from 'node:crypto';
import { authResolvers } from '../../src/modules/auth/auth.resolvers';
import { confirmMfaEnrolment, startMfaEnrolment } from '../../src/modules/auth/mfa.service';
import { SessionModel } from '../../src/modules/auth/session.model';
import { AuditLogModel } from '../../src/modules/audit';
import { verifyToken } from '../../src/utils/jwt';
import { totpCode, stepAt } from '../../src/utils/totp';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const { Query, Mutation } = authResolvers;
const PASSWORD = `pw-${randomUUID()}`;
const codeNow = (secret: string) => totpCode(secret, stepAt(new Date()));

type SignIn = { token: string; user: { id: string; email: string } | null; mfaRequired: boolean };

const person = () => seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.EMPLOYEE]);

/** A fresh request: the one-sign-in-per-request guard counts per context. */
const request = (ip?: string): GraphQLContext => ({
  user: null,
  ip,
  userAgent: ip ? 'Safari' : undefined,
});

async function signIn(email: string, ip = '198.51.100.40') {
  return (await Mutation.login(null, { email, password: PASSWORD }, request(ip))) as SignIn;
}

/** The context a later request from that sign-in carries. */
const sessionCtx = (result: SignIn): GraphQLContext => {
  const claims = verifyToken(result.token);
  return {
    user: {
      id: claims?.id ?? '',
      email: claims?.email ?? '',
      roles: [ROLES.EMPLOYEE],
      sid: claims?.sid,
    },
  };
};

describe('signing in through the API', () => {
  it('returns the account with an id and audits the sign-in', async () => {
    const user = await person();

    const result = await signIn(user.email);

    expect(result).toMatchObject({ mfaRequired: false, user: { id: user.id, email: user.email } });
    const audit = await AuditLogModel.findOne({ action: 'LOGIN' }).lean();
    expect(audit).toMatchObject({ summary: 'Signed in', entityId: user.id, ip: '198.51.100.40' });
  });

  it('records an unknown device for a request that says nothing about itself', async () => {
    const user = await person();

    await Mutation.login(null, { email: user.email, password: PASSWORD }, request());

    const session = await SessionModel.findOne({ userId: user.id }).lean();
    expect(session).toMatchObject({ ip: 'unknown', userAgent: '' });
  });

  it('answers a challenge, unaudited, when two-factor is on — then audits the second step', async () => {
    const user = await person();
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, codeNow(secret));

    const first = await Mutation.login(
      null,
      { email: user.email, password: PASSWORD },
      request('198.51.100.41'),
    );
    expect(first).toEqual({
      token: '',
      user: null,
      mfaRequired: true,
      mfaChallenge: expect.any(String),
    });
    expect(await AuditLogModel.countDocuments({ action: 'LOGIN' })).toBe(0);

    const second = (await Mutation.verifyMfa(
      null,
      { challenge: first.mfaChallenge, code: codeNow(secret) },
      request('198.51.100.41'),
    )) as SignIn;

    expect(second).toMatchObject({ mfaRequired: false, user: { id: user.id } });
    const audit = await AuditLogModel.findOne({ action: 'LOGIN' }).lean();
    expect(audit?.summary).toBe('Signed in with a second factor');
  });
});

describe('the signed-in account', () => {
  it('reads itself back with an id', async () => {
    const user = await person();
    const ctx = sessionCtx(await signIn(user.email));

    await expect(Query.me(null, {}, ctx)).resolves.toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it('refuses an anonymous request', async () => {
    await expect(Query.me(null, {}, { user: null })).rejects.toThrow('Authentication required');
    await expect(Query.mySessions(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('managing sessions through the API', () => {
  it('lists the caller s sessions with this one marked', async () => {
    const user = await person();
    const ctx = sessionCtx(await signIn(user.email));
    await signIn(user.email, '198.51.100.42');

    const sessions = await Query.mySessions(null, {}, ctx);

    expect(sessions).toHaveLength(2);
    expect(sessions.filter((session) => session.current)).toHaveLength(1);
  });

  it('will not revoke the session asking — that is signing out', async () => {
    const user = await person();
    const ctx = sessionCtx(await signIn(user.email));

    await expect(Mutation.revokeSession(null, { id: ctx.user?.sid ?? '' }, ctx)).rejects.toThrow(
      'That is this session. Sign out instead.',
    );
  });

  it('revokes another of the caller s sessions', async () => {
    const user = await person();
    const ctx = sessionCtx(await signIn(user.email));
    const other = sessionCtx(await signIn(user.email, '198.51.100.43'));

    await expect(Mutation.revokeSession(null, { id: other.user?.sid ?? '' }, ctx)).resolves.toBe(
      true,
    );
    expect(await Query.mySessions(null, {}, ctx)).toHaveLength(1);
  });

  it('signs out everywhere else', async () => {
    const user = await person();
    const ctx = sessionCtx(await signIn(user.email));
    await signIn(user.email, '198.51.100.44');
    await signIn(user.email, '198.51.100.45');

    await expect(Mutation.revokeOtherSessions(null, {}, ctx)).resolves.toBe(2);
    expect(await Query.mySessions(null, {}, ctx)).toEqual([
      expect.objectContaining({ current: true }),
    ]);
  });
});
