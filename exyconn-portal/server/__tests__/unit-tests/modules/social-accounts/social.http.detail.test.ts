import { getJson } from '../../../../src/modules/social-accounts/social.http';

afterEach(() => jest.restoreAllMocks());

describe('a provider error that is not plain text', () => {
  it('shows a structured error as JSON rather than "[object Object]"', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: { code: 190, hint: 'token expired' } }), {
        status: 401,
      }),
    );

    await expect(getJson('Meta', 'https://api/m')).rejects.toThrow(
      'Meta refused the connection: {"code":190,"hint":"token expired"}',
    );
  });
});
