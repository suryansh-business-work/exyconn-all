import {
  finishGoogleSignIn,
  redeemGoogleTicket,
  startGoogleSignIn,
  takeGoogleState,
} from '../../../../../src/modules/auth/google/google-sign-in.flow';
import {
  GoogleSignInStateModel,
  GoogleSignInTicketModel,
} from '../../../../../src/modules/auth/google/google-sign-in.models';
import { sha256 } from '../../../../../src/modules/auth/google/google-sign-in.oauth';
import { UserModel } from '../../../../../src/modules/admin/user.model';
import { env } from '../../../../../src/config/env';
import { ROLES } from '../../../../../src/constants/roles';
import { seedUser } from '../../../../helpers';
import { CLIENT_ID, credential, googleAnswersFor, storeGoogleClient } from './googleSignIn.fixtures';

const PORTAL = `${env.corsOrigins[0]}/sign-in?next=%2F`;
const EMAIL = 'meera@exyconn.com';

afterEach(() => jest.restoreAllMocks());

const seedMeera = () => seedUser(EMAIL, credential('pw'), [ROLES.EMPLOYEE]);

describe('startGoogleSignIn', () => {
  it('stores the state and sends the browser to Google with its nonce and PKCE challenge', async () => {
    await storeGoogleClient();
    const url = new URL(await startGoogleSignIn(PORTAL));
    expect(url.searchParams.get('client_id')).toBe(CLIENT_ID);
    const nonce = url.searchParams.get('state') ?? '';
    const state = await GoogleSignInStateModel.findOne({ nonce }).lean();
    expect(state?.returnTo).toBe(PORTAL);
    expect(url.searchParams.get('code_challenge')).toBe(sha256(state?.codeVerifier ?? ''));
  });

  it('refuses while Google sign-in is off or incomplete', async () => {
    await expect(startGoogleSignIn(PORTAL)).rejects.toThrow('Google sign-in is not switched on.');
    await storeGoogleClient({ clientSecret: '' });
    await expect(startGoogleSignIn(PORTAL)).rejects.toThrow('Google sign-in is not switched on.');
  });

  it.each(['https://evil.example/sign-in', 'not a url'])(
    'will not return anywhere but a portal page (%s)',
    async (returnTo) => {
      await storeGoogleClient();
      await expect(startGoogleSignIn(returnTo)).rejects.toThrow('That is not a portal address.');
      expect(await GoogleSignInStateModel.countDocuments()).toBe(0);
    },
  );
});

describe('takeGoogleState', () => {
  it('hands the state back once', async () => {
    await GoogleSignInStateModel.create({ nonce: 'n1', codeVerifier: 'v1', returnTo: PORTAL });
    expect((await takeGoogleState('n1'))?.codeVerifier).toBe('v1');
    expect(await takeGoogleState('n1')).toBeNull();
  });
});

describe('finishGoogleSignIn / redeemGoogleTicket', () => {
  it('issues a one-time ticket for the account Google’s email matches', async () => {
    await storeGoogleClient();
    const user = await seedMeera();
    const fetchMock = googleAnswersFor(' Meera@Exyconn.com ');
    const ticket = await finishGoogleSignIn({ codeVerifier: 'v1' }, 'code-1');
    const body = new URLSearchParams(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.get('code_verifier')).toBe('v1');
    expect((await GoogleSignInTicketModel.findOne().lean())?.ticketHash).toBe(sha256(ticket));

    expect((await redeemGoogleTicket(ticket)).id).toBe(user.id);
    await expect(redeemGoogleTicket(ticket)).rejects.toThrow(
      'That Google sign-in has expired. Try again.',
    );
  });

  it('creates nobody for an unknown or inactive address', async () => {
    await storeGoogleClient();
    const fetchMock = googleAnswersFor('stranger@exyconn.com');
    await expect(finishGoogleSignIn({ codeVerifier: 'v' }, 'c')).rejects.toThrow(
      'No active portal account uses stranger@exyconn.com. Ask an administrator to invite it.',
    );
    const user = await seedMeera();
    await UserModel.updateOne({ _id: user._id }, { isActive: false });
    fetchMock.mockRestore();
    googleAnswersFor(EMAIL);
    await expect(finishGoogleSignIn({ codeVerifier: 'v' }, 'c')).rejects.toThrow(
      `No active portal account uses ${EMAIL}.`,
    );
    expect(await GoogleSignInTicketModel.countDocuments()).toBe(0);
  });

  it('tells a blocked account so', async () => {
    await storeGoogleClient();
    const user = await seedMeera();
    await UserModel.updateOne({ _id: user._id }, { isBlocked: true });
    googleAnswersFor(EMAIL);
    await expect(finishGoogleSignIn({ codeVerifier: 'v' }, 'c')).rejects.toThrow(
      'Your account is temporarily blocked. Contact an administrator.',
    );
  });

  it('refuses a ticket whose account was switched off after it was issued', async () => {
    const user = await seedMeera();
    await GoogleSignInTicketModel.create({ ticketHash: sha256('t1'), userId: user.id });
    await UserModel.updateOne({ _id: user._id }, { isActive: false });
    await expect(redeemGoogleTicket('t1')).rejects.toThrow('That Google sign-in has expired.');
  });
});
