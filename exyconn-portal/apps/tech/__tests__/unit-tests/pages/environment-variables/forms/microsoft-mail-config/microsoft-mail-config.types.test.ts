import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TENANT,
  makeMicrosoftMailSchema,
  toMicrosoftMailValues,
  type MicrosoftMailConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/microsoft-mail-config';
import { describeOAuthClientSchema } from '../oauth-client-schema.suite';

describeOAuthClientSchema({
  name: 'makeMicrosoftMailSchema',
  make: makeMicrosoftMailSchema,
  clientId: '11111111-2222-3333-4444-555555555555',
  extra: { tenant: DEFAULT_TENANT },
  missingClientId: 'Add the client ID before turning Microsoft Mail on',
  missingSecret: 'Add the client secret before turning Microsoft Mail on',
});

describe('toMicrosoftMailValues', () => {
  const row = (tenant: string): MicrosoftMailConfigRow => ({
    id: 'm',
    clientId: 'client',
    tenant,
    hasClientSecret: true,
    enabled: true,
    accountCount: 0,
    redirectUri: 'https://api.example.test/cb',
  });

  it('keeps a stored tenant', () => {
    expect(toMicrosoftMailValues(row('organizations')).tenant).toBe('organizations');
  });

  it('uses the common tenant when none is stored, and never prefills the secret', () => {
    expect(toMicrosoftMailValues(row(''))).toEqual({
      clientId: 'client',
      clientSecret: '',
      tenant: 'common',
      enabled: true,
    });
  });
});
