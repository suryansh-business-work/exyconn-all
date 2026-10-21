import { useTestOrganization } from '../../../helpers';
import {
  authorizeExtension,
  exchangeCode,
  extensionRedirectAllowed,
  extensionSessionIsLive,
  refreshSession,
  revokeByRefreshToken,
  TokenRefusal,
} from '../../../../src/modules/meeting-assistant/extension.auth';
import {
  MaAuthCodeModel,
  MaExtensionSessionModel,
} from '../../../../src/modules/meeting-assistant/models';
import { AuditLogModel } from '../../../../src/modules/audit';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { verifyToken } from '../../../../src/utils/jwt';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { EXTENSION_ID } from './ma.env';
import { authorizeInput, DEVICE, grantOf, issueCode, pkce, REDIRECT, signIn } from './ma.signin';
import { seedAccount, setMaSettings } from './ma.fixtures';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';

jest.mock('../../../../src/config/env', () =>
  jest.requireActual('./ma.env').envTrustingExtension(),
);

const organizationId = useTestOrganization();

/** The OAuth error code a token call is refused with, or 'OK'. */
async function refusalOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'OK';
  } catch (error) {
    if (error instanceof TokenRefusal) {
      return error.code;
    }
    throw error;
  }
}

let actor: MaActor;

beforeEach(async () => {
  actor = await seedAccount('Asha', [ROLES.EMPLOYEE]);
});

describe('authorizing the extension', () => {
  it('trusts only the configured extension on its own chromiumapp redirect', () => {
    expect(extensionRedirectAllowed(EXTENSION_ID, REDIRECT)).toBe(true);
    expect(extensionRedirectAllowed('pppppppppppppppppppppppppppppppp', REDIRECT)).toBe(false);
    expect(extensionRedirectAllowed(EXTENSION_ID, 'https://evil.chromiumapp.org/callback')).toBe(
      false,
    );
  });

  it('hands the browser a one-time code and the state back on the redirect', async () => {
    const { url, code } = await issueCode(actor);

    expect(url.origin).toBe(`https://${EXTENSION_ID}.chromiumapp.org`);
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(code).toHaveLength(43);
    // Only the hash is stored.
    expect(await MaAuthCodeModel.countDocuments({ codeHash: code })).toBe(0);
    expect(await MaAuthCodeModel.countDocuments()).toBe(1);
  });

  it('refuses an untrusted extension, a foreign redirect, a bad challenge or state', async () => {
    const { challenge } = pkce();
    const refused = [
      authorizeInput(challenge, { extensionId: 'pppppppppppppppppppppppppppppppp' }),
      authorizeInput(challenge, { redirectUri: 'https://example.com/callback' }),
      authorizeInput(challenge, { codeChallengeMethod: 'plain' }),
      authorizeInput('too-short'),
      authorizeInput(challenge, { state: '' }),
      authorizeInput(challenge, { state: 'x'.repeat(201) }),
    ];

    const codes = await Promise.all(
      refused.map((input) => codeOf(authorizeExtension(actor, input))),
    );

    expect(codes).toEqual(refused.map(() => 'BAD_USER_INPUT'));
    expect(await MaAuthCodeModel.countDocuments()).toBe(0);
  });
});

describe('exchanging the code', () => {
  it('issues a short-lived access token bound to a new session, and audits the sign-in', async () => {
    const tokens = await signIn(actor);

    expect(tokens).toMatchObject({ token_type: 'Bearer', expires_in: 900 });
    const claims = verifyToken(tokens.access_token);
    expect(claims).toMatchObject({ id: actor.id, roles: [ROLES.EMPLOYEE], organizationId });
    const session = await MaExtensionSessionModel.findById(claims?.esid).lean();
    expect(session).toMatchObject({ userId: actor.id, extensionId: EXTENSION_ID, ...DEVICE });
    expect(session?.refreshHash).not.toBe(tokens.refresh_token);
    expect(await extensionSessionIsLive(String(claims?.esid), actor.id)).toBe(true);
    expect(await AuditLogModel.countDocuments({ action: 'LOGIN', actorId: actor.id })).toBe(1);
  });

  it('spends the code on first use', async () => {
    const { code, verifier } = await issueCode(actor);

    await exchangeCode(grantOf(code, verifier), DEVICE);

    expect(await refusalOf(exchangeCode(grantOf(code, verifier), DEVICE))).toBe('invalid_grant');
  });

  it('refuses the wrong verifier, a malformed one, the wrong redirect and an expired code', async () => {
    const expired = await issueCode(actor);
    await MaAuthCodeModel.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const wrong = await issueCode(actor);
    const malformed = await issueCode(actor);
    const redirect = await issueCode(actor);
    const valid = await issueCode(actor);

    expect(await refusalOf(exchangeCode(grantOf(wrong.code, pkce().verifier), DEVICE))).toBe(
      'invalid_grant',
    );
    expect(await refusalOf(exchangeCode(grantOf(malformed.code, 'short'), DEVICE))).toBe(
      'invalid_request',
    );
    expect(
      await refusalOf(
        exchangeCode(
          { ...grantOf(redirect.code, redirect.verifier), redirectUri: `${REDIRECT}/other` },
          DEVICE,
        ),
      ),
    ).toBe('invalid_grant');
    expect(await refusalOf(exchangeCode(grantOf(expired.code, expired.verifier), DEVICE))).toBe(
      'invalid_grant',
    );
    expect(await refusalOf(exchangeCode(grantOf(valid.code, valid.verifier), DEVICE))).toBe('OK');
    expect(await MaExtensionSessionModel.countDocuments()).toBe(1);
  });

  it('refuses when the assistant is off, the person is not allowed, or the account is inactive', async () => {
    const off = await issueCode(actor);
    await setMaSettings({ enabled: false });
    expect(await refusalOf(exchangeCode(grantOf(off.code, off.verifier), DEVICE))).toBe(
      'access_denied',
    );

    await setMaSettings({ enabled: true, allowedUserIds: ['someone-else'] });
    const notAllowed = await issueCode(actor);
    expect(
      await refusalOf(exchangeCode(grantOf(notAllowed.code, notAllowed.verifier), DEVICE)),
    ).toBe('access_denied');

    await setMaSettings({ allowedUserIds: [actor.id] });
    await UserModel.updateOne({ _id: actor.id }, { $set: { isActive: false } });
    const inactive = await issueCode(actor);
    expect(await refusalOf(exchangeCode(grantOf(inactive.code, inactive.verifier), DEVICE))).toBe(
      'access_denied',
    );
    expect(await MaExtensionSessionModel.countDocuments()).toBe(0);
  });
});

describe('refreshing and signing out', () => {
  it('rotates the refresh token, refusing the old one afterwards', async () => {
    const first = await signIn(actor);

    const second = await refreshSession(first.refresh_token, '1.1.0');

    expect(second.refresh_token).not.toBe(first.refresh_token);
    const esid = verifyToken(second.access_token)?.esid;
    expect(esid).toBe(verifyToken(first.access_token)?.esid);
    expect((await MaExtensionSessionModel.findById(esid).lean())?.extensionVersion).toBe('1.1.0');
    const third = await refreshSession(second.refresh_token, '');
    expect(third.refresh_token).not.toBe(second.refresh_token);
  });

  it('revokes the whole session when a rotated-away token is presented again', async () => {
    const first = await signIn(actor);
    const second = await refreshSession(first.refresh_token, '');
    const esid = String(verifyToken(second.access_token)?.esid);

    expect(await refusalOf(refreshSession(first.refresh_token, ''))).toBe('invalid_grant');

    const session = await MaExtensionSessionModel.findById(esid).lean();
    expect(session?.revokedReason).toBe('Refresh token reused');
    expect(await extensionSessionIsLive(esid, actor.id)).toBe(false);
    expect(await refusalOf(refreshSession(second.refresh_token, ''))).toBe('invalid_grant');
  });

  it('signs one extension out, and ignores a token it does not know', async () => {
    const tokens = await signIn(actor);
    const esid = String(verifyToken(tokens.access_token)?.esid);

    await revokeByRefreshToken(tokens.refresh_token);
    await expect(revokeByRefreshToken('unknown-token')).resolves.toBeUndefined();

    expect(await extensionSessionIsLive(esid, actor.id)).toBe(false);
    expect(await refusalOf(refreshSession(tokens.refresh_token, ''))).toBe('invalid_grant');
  });

  it('treats an expired session, or another person’s, as not live', async () => {
    const tokens = await signIn(actor);
    const esid = String(verifyToken(tokens.access_token)?.esid);

    expect(await extensionSessionIsLive(esid, 'someone-else')).toBe(false);
    await MaExtensionSessionModel.updateOne(
      { _id: esid },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    expect(await extensionSessionIsLive(esid, actor.id)).toBe(false);
    expect(await refusalOf(refreshSession(tokens.refresh_token, ''))).toBe('invalid_grant');
  });

  it('stops renewing once the assistant is switched off for the company', async () => {
    const tokens = await signIn(actor);
    await setMaSettings({ enabled: false });

    expect(await refusalOf(refreshSession(tokens.refresh_token, ''))).toBe('access_denied');
  });
});
