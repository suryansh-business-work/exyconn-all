import { GoogleSignInConfigModel } from '../../../../../src/modules/auth/google/google-sign-in.models';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { credential } from '../../tech/tech.fixtures';

export { credential };

export const CLIENT_ID = 'client-123.apps.googleusercontent.com';

/** Stores the install's Google client, switched on unless told otherwise. */
export const storeGoogleClient = (fields: Record<string, unknown> = {}) =>
  runAsPlatform(() =>
    GoogleSignInConfigModel.create({
      key: 'default',
      clientId: CLIENT_ID,
      clientSecret: credential('google'),
      enabled: true,
      ...fields,
    }),
  );

/** An unsigned ID token carrying `claims`, as Google's token endpoint hands one back. */
export function idTokenWith(claims: Record<string, unknown>): string {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return [part({ alg: 'RS256' }), part(claims), 'signature'].join('.');
}

/** Claims Google would put in a good token for `email`, valid for an hour. */
export const goodClaims = (email: string): Record<string, unknown> => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  exp: Math.floor(Date.now() / 1000) + 3600,
  email,
  email_verified: true,
});

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Makes Google's token endpoint answer with an ID token for `email`. */
export const googleAnswersFor = (email: string) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => jsonResponse({ id_token: idTokenWith(goodClaims(email)) }));
