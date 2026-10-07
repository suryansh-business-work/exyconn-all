import { testAppConnection } from '../../../../src/modules/social-accounts/social.test-connection';
import { useTestOrganization } from '../../../helpers';
import { configureApp, fakeFetch, formOf } from './social.fixtures';

useTestOrganization();

afterEach(() => jest.restoreAllMocks());

describe('testing an app’s credentials', () => {
  it('asks for the secret when only the client ID is stored', async () => {
    await configureApp('LINKEDIN', { clientSecret: '', enabled: false });
    const fetched = jest.spyOn(globalThis, 'fetch');
    expect(await testAppConnection('LINKEDIN')).toEqual({
      ok: false,
      message: 'Add the LinkedIn client ID and secret first.',
    });
    expect(fetched).not.toHaveBeenCalled();
  });

  it('passes outright when the provider accepts the probe', async () => {
    await configureApp('LINKEDIN');
    const calls = fakeFetch([[/oauth\/v2\/accessToken/, 200, { access_token: 'unexpected' }]]);
    expect(await testAppConnection('LINKEDIN')).toEqual({
      ok: true,
      message: "LinkedIn accepted the app's credentials.",
    });
    expect(formOf(calls[0]).code).toBe('exyconn-connection-test');
  });

  it('fails when the provider says the client is not authorised', async () => {
    await configureApp('X');
    fakeFetch([[/2\/oauth2\/token/, 401, { error: 'unauthorized_client' }]]);
    const result = await testAppConnection('X');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch('X rejected the client ID or secret.');
  });
});
