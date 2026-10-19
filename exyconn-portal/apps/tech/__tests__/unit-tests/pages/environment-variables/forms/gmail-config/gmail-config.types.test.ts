import { describe, expect, it } from 'vitest';
import {
  makeGmailSchema,
  toGmailValues,
} from '../../../../../../src/pages/environment-variables/forms/gmail-config';
import { describeOAuthClientSchema } from '../oauth-client-schema.suite';

describeOAuthClientSchema({
  name: 'makeGmailSchema',
  make: makeGmailSchema,
  clientId: 'abc.apps.googleusercontent.com',
  extra: {},
  missingClientId: 'Add the client ID before turning Gmail on',
  missingSecret: 'Add the client secret before turning Gmail on',
});

describe('toGmailValues', () => {
  it('copies the stored client and never the secret', () => {
    expect(
      toGmailValues({
        id: 'g',
        clientId: 'abc.apps.googleusercontent.com',
        hasClientSecret: true,
        enabled: false,
        accountCount: 0,
        redirectUri: 'https://api.example.test/cb',
      }),
    ).toEqual({ clientId: 'abc.apps.googleusercontent.com', clientSecret: '', enabled: false });
  });
});
