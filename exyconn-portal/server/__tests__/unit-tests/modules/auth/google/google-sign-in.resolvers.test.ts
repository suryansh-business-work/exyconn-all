import { Types } from 'mongoose';
import { googleSignInResolvers } from '../../../../../src/modules/auth/google/google-sign-in.resolvers';
import { GoogleSignInTicketModel } from '../../../../../src/modules/auth/google/google-sign-in.models';
import { googleRedirectUri, sha256 } from '../../../../../src/modules/auth/google/google-sign-in.oauth';
import { AuditLogModel } from '../../../../../src/modules/audit';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import { env } from '../../../../../src/config/env';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { seedUser } from '../../../../helpers';
import { CLIENT_ID, credential, jsonResponse, storeGoogleClient } from './googleSignIn.fixtures';

const { Query, Mutation } = googleSignInResolvers;

const tech: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.SUPER_ADMIN], email: 'sa@x.io' },
};
const outsider: GraphQLContext = {
  user: {
    id: new Types.ObjectId().toHexString(),
    roles: [ROLES.TECH],
    email: 'tech@customer.io',
    organizationId: new Types.ObjectId().toHexString(),
  },
};
const REFUSED = 'Only the platform operator may manage this.';

const lastAudit = () => AuditLogModel.findOne().sort({ _id: -1 }).lean();

beforeEach(() => invalidatePlatformOperatorCache());
afterEach(() => jest.restoreAllMocks());

describe('googleSignInConfig / googleSignInEnabled', () => {
  it('shows Tech the config without the secret, created empty on first look', async () => {
    await expect(Query.googleSignInConfig({}, {}, tech)).resolves.toMatchObject({
      id: 'default',
      clientId: '',
      hasClientSecret: false,
      enabled: false,
      redirectUri: googleRedirectUri(),
    });
    await expect(Query.googleSignInEnabled()).resolves.toBe(false);
  });

  it('tells the sign-in page once the client is complete and on', async () => {
    await storeGoogleClient();
    await expect(Query.googleSignInEnabled()).resolves.toBe(true);
    const shown = await Query.googleSignInConfig({}, {}, tech);
    expect(shown).toMatchObject({ clientId: CLIENT_ID, hasClientSecret: true });
    expect(JSON.stringify(shown)).not.toContain(credential('google'));
  });

  it('keeps the config from a company that does not operate the platform', async () => {
    await expect(Query.googleSignInConfig({}, {}, outsider)).rejects.toThrow(REFUSED);
  });
});

describe('saveGoogleSignInConfig / testGoogleSignInConfig', () => {
  it('saves the client and audits whether it is on or off', async () => {
    const input = { clientId: CLIENT_ID, clientSecret: credential('google'), enabled: true };
    const saved = await Mutation.saveGoogleSignInConfig({}, { input }, tech);
    expect(saved).toMatchObject({ clientId: CLIENT_ID, enabled: true, hasClientSecret: true });
    expect(await lastAudit()).toMatchObject({
      action: 'UPDATE',
      module: 'TechConfig',
      entityId: 'google-sign-in',
      summary: 'Saved Google sign-in (on)',
    });
    await Mutation.saveGoogleSignInConfig(
      {},
      { input: { ...input, clientSecret: '', enabled: false } },
      tech,
    );
    expect((await lastAudit())?.summary).toBe('Saved Google sign-in (off)');
    await expect(Query.googleSignInConfig({}, {}, tech)).resolves.toMatchObject({
      hasClientSecret: true,
      enabled: false,
    });
  });

  it('checks the client with Google', async () => {
    await storeGoogleClient();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ error: 'invalid_grant' }, 400));
    await expect(Mutation.testGoogleSignInConfig({}, {}, tech)).resolves.toBe(
      'Google recognised the client ID and secret.',
    );
  });

  it('lets only the platform’s Tech staff save or test', async () => {
    const input = { clientId: CLIENT_ID, clientSecret: '', enabled: false };
    await expect(Mutation.saveGoogleSignInConfig({}, { input }, outsider)).rejects.toThrow(
      REFUSED,
    );
    await expect(Mutation.testGoogleSignInConfig({}, {}, outsider)).rejects.toThrow(REFUSED);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });
});

describe('startGoogleSignIn / completeGoogleSignIn', () => {
  it('starts a sign-in that returns to a portal page', async () => {
    await storeGoogleClient();
    const url = await Mutation.startGoogleSignIn({}, { returnTo: `${env.corsOrigins[0]}/` });
    expect(url.startsWith('https://accounts.google.com/')).toBe(true);
  });

  it('redeems the ticket into a session, once per request, auditing the sign-in', async () => {
    const user = await seedUser('meera@exyconn.com', credential('pw'), [ROLES.EMPLOYEE]);
    await GoogleSignInTicketModel.create({ ticketHash: sha256('ticket-1'), userId: user.id });
    const ctx: GraphQLContext = { user: null };

    const result = await Mutation.completeGoogleSignIn({}, { ticket: 'ticket-1' }, ctx);

    expect(result.mfaRequired).toBe(false);
    expect(result.token).not.toBe('');
    expect(result.user).toMatchObject({ id: user.id, email: 'meera@exyconn.com' });
    expect(await lastAudit()).toMatchObject({ action: 'LOGIN', summary: 'Signed in with Google' });
    await expect(Mutation.completeGoogleSignIn({}, { ticket: 'ticket-1' }, ctx)).rejects.toThrow(
      'Only one sign-in is allowed per request.',
    );
  });

  it('refuses a ticket that was never issued', async () => {
    await expect(
      Mutation.completeGoogleSignIn({}, { ticket: 'made-up' }, { user: null }),
    ).rejects.toThrow('That Google sign-in has expired. Try again.');
  });
});
