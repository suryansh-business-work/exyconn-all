import { useTestOrganization } from '../../../helpers';
import {
  completeMfaSignIn,
  signInWithPassword,
  TokenRefusal,
  type TokenResponse,
} from '../../../../src/modules/meeting-assistant/extension.auth';
import { MaExtensionSessionModel } from '../../../../src/modules/meeting-assistant/models';
import * as authService from '../../../../src/modules/auth/auth.service';
import * as mfa from '../../../../src/modules/auth/mfa.service';
import * as workspace from '../../../../src/modules/auth/workspace-status';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { verifyMfaChallenge, verifyToken } from '../../../../src/utils/jwt';
import { unauthenticated } from '../../../../src/utils/errors';
import { ROLES } from '../../../../src/constants/roles';
import { EXTENSION_ID } from './ma.env';
import { DEVICE } from './ma.signin';
import { seedAccount } from './ma.fixtures';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';

jest.mock('../../../../src/config/env', () =>
  jest.requireActual('./ma.env').envTrustingExtension(),
);

useTestOrganization();

const UNLISTED = 'pppppppppppppppppppppppppppppppp';
const password = () => `pw-${Date.now()}`;

/** The OAuth refusal a sign-in step settles with, as [code, message]. */
async function refusalOf(promise: Promise<unknown>): Promise<[string, string]> {
  try {
    await promise;
    return ['OK', ''];
  } catch (error) {
    if (error instanceof TokenRefusal) {
      return [error.code, error.message];
    }
    throw error;
  }
}

let actor: MaActor;

/** Makes the password check pass for `actor`, as if they typed the right one. */
async function passwordAccepted() {
  const user = await UserModel.findById(actor.id);
  return jest.spyOn(authService, 'verifyCredentials').mockResolvedValue(user as never);
}

const grant = (extensionId = EXTENSION_ID) => ({
  email: actor.email,
  password: password(),
  extensionId,
  ip: '10.0.0.1',
});

beforeEach(async () => {
  actor = await seedAccount('Ravi', [ROLES.EMPLOYEE]);
});

afterEach(() => jest.restoreAllMocks());

describe('signing the extension in with a password', () => {
  it('opens a session with tokens, checked like the portal sign-in, and audits it', async () => {
    const check = await passwordAccepted();
    const step = (await signInWithPassword(grant(), DEVICE)) as TokenResponse;

    expect(check).toHaveBeenCalledWith(actor.email, expect.any(String), '10.0.0.1');
    expect(verifyToken(step.access_token)?.esid).toBeTruthy();
    expect(step.refresh_token).toHaveLength(43);
    expect(await MaExtensionSessionModel.countDocuments({ userId: actor.id })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'LOGIN', actorId: actor.id })).toBe(1);
  });

  it('asks for the second factor instead when two-factor is on, opening no session', async () => {
    await passwordAccepted();
    jest.spyOn(mfa, 'mfaIsOn').mockResolvedValue(true);

    const step = await signInWithPassword(grant(), DEVICE);

    expect(step).toEqual({ mfa_required: true, mfa_challenge: expect.any(String) });
    expect('mfa_challenge' in step && verifyMfaChallenge(step.mfa_challenge)).toBe(actor.id);
    expect(await MaExtensionSessionModel.countDocuments()).toBe(0);
  });

  it('refuses a wrong password with the portal message', async () => {
    expect(await refusalOf(signInWithPassword(grant(), DEVICE))).toEqual([
      'invalid_grant',
      expect.stringMatching(/.+/),
    ]);
    expect(await MaExtensionSessionModel.countDocuments()).toBe(0);
  });

  it('signs in an unpacked build whose id is not listed: the password is the proof', async () => {
    await passwordAccepted();
    const step = (await signInWithPassword(grant(UNLISTED), DEVICE)) as TokenResponse;

    expect(verifyToken(step.access_token)?.esid).toBeTruthy();
    expect(await MaExtensionSessionModel.findOne({ userId: actor.id }).lean()).toMatchObject({
      extensionId: UNLISTED,
    });
  });

  it('refuses a suspended company', async () => {
    await passwordAccepted();
    jest
      .spyOn(workspace, 'assertWorkspaceOpen')
      .mockImplementation(async () => unauthenticated('This workspace is suspended.'));
    expect(await refusalOf(signInWithPassword(grant(), DEVICE))).toEqual([
      'invalid_grant',
      'This workspace is suspended.',
    ]);
  });

  it('refuses an account outside any company', async () => {
    const user = await UserModel.findById(actor.id);
    jest
      .spyOn(authService, 'verifyCredentials')
      .mockResolvedValue({ ...user?.toObject(), id: actor.id, organizationId: null } as never);
    jest.spyOn(workspace, 'assertWorkspaceOpen').mockResolvedValue();
    expect(await refusalOf(signInWithPassword(grant(), DEVICE))).toEqual([
      'access_denied',
      'This account cannot sign in.',
    ]);
  });

  it('passes on a failure that is not a sign-in refusal', async () => {
    jest.spyOn(authService, 'verifyCredentials').mockRejectedValue(new Error('database down'));
    await expect(signInWithPassword(grant(), DEVICE)).rejects.toThrow('database down');
  });
});

describe('the second factor', () => {
  const mfaGrant = (extensionId = EXTENSION_ID) => ({
    challenge: 'challenge-1',
    code: '123456',
    extensionId,
    ip: '10.0.0.1',
  });

  it('opens the session once the code is right', async () => {
    const user = await UserModel.findById(actor.id);
    const prove = jest.spyOn(authService, 'proveSecondFactor').mockResolvedValue(user as never);

    const step = (await completeMfaSignIn(mfaGrant(), DEVICE)) as TokenResponse;

    expect(prove).toHaveBeenCalledWith('challenge-1', '123456', '10.0.0.1');
    expect(verifyToken(step.access_token)?.esid).toBeTruthy();
  });

  it('refuses a wrong or expired code with the portal message', async () => {
    expect(await refusalOf(completeMfaSignIn(mfaGrant(), DEVICE))).toEqual([
      'invalid_grant',
      'That sign-in has expired. Enter your password again.',
    ]);
  });

  it('refuses an account outside any company', async () => {
    const user = await UserModel.findById(actor.id);
    jest
      .spyOn(authService, 'proveSecondFactor')
      .mockResolvedValue({ ...user?.toObject(), id: actor.id, organizationId: null } as never);
    expect((await refusalOf(completeMfaSignIn(mfaGrant(), DEVICE)))[0]).toBe('access_denied');
  });
});
