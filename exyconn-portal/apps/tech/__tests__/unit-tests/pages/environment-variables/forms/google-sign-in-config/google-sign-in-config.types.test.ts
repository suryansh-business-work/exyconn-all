import { describe, expect, it } from 'vitest';
import {
  makeGoogleSignInSchema,
  toGoogleSignInValues,
} from '../../../../../../src/pages/environment-variables/forms/google-sign-in-config';
import { describeOAuthClientSchema } from '../oauth-client-schema.suite';

describeOAuthClientSchema({
  name: 'makeGoogleSignInSchema',
  make: makeGoogleSignInSchema,
  clientId: 'abc.apps.googleusercontent.com',
  extra: {},
  missingClientId: 'Add the client ID before turning Google sign-in on',
  missingSecret: 'Add the client secret before turning Google sign-in on',
});

describe('toGoogleSignInValues', () => {
  it('copies the stored client and never the secret', () => {
    expect(
      toGoogleSignInValues({
        id: 'g',
        clientId: 'abc.apps.googleusercontent.com',
        hasClientSecret: true,
        enabled: true,
        redirectUri: 'https://api.example.test/cb',
      }),
    ).toEqual({ clientId: 'abc.apps.googleusercontent.com', clientSecret: '', enabled: true });
  });
});
