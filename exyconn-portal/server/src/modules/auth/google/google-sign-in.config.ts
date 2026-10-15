import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { secretHint } from '../../tech/tech.secrets';
import { BAD_CREDENTIALS } from '../../social-accounts/social.test-connection';
import { GoogleSignInConfigModel, type GoogleSignInConfigDocument } from './google-sign-in.models';
import { exchangeCode, googleRedirectUri } from './google-sign-in.oauth';

const KEY = 'default';

export interface GoogleSignInConfigInput {
  clientId: string;
  /** Blank keeps the stored secret. */
  clientSecret: string;
  enabled: boolean;
}

/** The one row, created empty the first time anyone looks. */
export const readGoogleConfig = () =>
  runAsPlatform(() =>
    GoogleSignInConfigModel.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: { key: KEY } },
      { upsert: true, new: true },
    ).lean<GoogleSignInConfigDocument>(),
  );

/** The config as the Tech screen sees it: never the secret, only whether one is stored. */
export function presentGoogleConfig(doc: GoogleSignInConfigDocument) {
  return {
    id: KEY,
    clientId: doc.clientId,
    hasClientSecret: doc.clientSecret !== '',
    clientSecretHint: secretHint(doc.clientSecret),
    enabled: doc.enabled,
    redirectUri: googleRedirectUri(),
    updatedAt: doc.updatedAt,
    updatedByName: doc.updatedByName,
  };
}

/** Whether the sign-in page should offer the button: switched on, with both halves stored. */
export const googleSignInReady = (doc: GoogleSignInConfigDocument) =>
  doc.enabled && doc.clientId !== '' && doc.clientSecret !== '';

export async function saveGoogleConfig(input: GoogleSignInConfigInput, actorName: string) {
  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret.trim();
  const stored = await readGoogleConfig();
  if (input.enabled && (clientId === '' || (clientSecret === '' && stored.clientSecret === ''))) {
    badRequest('Add the client ID and client secret before turning Google sign-in on.');
  }
  const update = {
    clientId,
    enabled: input.enabled,
    updatedByName: actorName,
    ...(clientSecret === '' ? {} : { clientSecret }),
  };
  const saved = await runAsPlatform(() =>
    GoogleSignInConfigModel.findOneAndUpdate(
      { key: KEY },
      { $set: update },
      { new: true },
    ).lean<GoogleSignInConfigDocument>(),
  );
  if (!saved) notFound('Google sign-in config');
  return saved;
}

/** A code Google never issued and a verifier of the length PKCE demands. */
const PROBE_CODE = 'exyconn-connection-test';
const PROBE_VERIFIER = 'x'.repeat(43);

/**
 * Proves the client ID and secret without anyone signing in: Google refuses a made-up code
 * either way, but a wrong client is "invalid_client" while a right one is "invalid_grant".
 */
export async function testGoogleConfig(): Promise<string> {
  const config = await readGoogleConfig();
  if (config.clientId === '' || config.clientSecret === '') {
    badRequest('Add the client ID and client secret first.');
  }
  try {
    await exchangeCode(config, PROBE_CODE, PROBE_VERIFIER);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (BAD_CREDENTIALS.test(message)) {
      badRequest(`Google rejected the client ID or secret. ${message}`);
    }
  }
  return 'Google recognised the client ID and secret.';
}
