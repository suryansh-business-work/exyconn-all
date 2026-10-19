import { env } from '../../../../src/config/env';
import {
  checkWithReacher,
  toCheckResult,
} from '../../../../src/modules/email-verification/reacher.client';
import { SAFE, fakeReacher } from './fakeReacher';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('toCheckResult', () => {
  it('reads a deliverable mailbox as VERIFIED with every signal', () => {
    expect(
      toCheckResult({
        ...SAFE,
        is_reachable: 'safe',
        syntax: { is_valid_syntax: true, suggestion: 'gmail.com' },
      }),
    ).toEqual({
      status: 'VERIFIED',
      reason: 'The mailbox exists and accepts email',
      syntaxValid: true,
      hasMx: true,
      deliverable: true,
      catchAll: false,
      disposable: false,
      roleAccount: false,
      suggestion: 'gmail.com',
    });
  });

  it('treats an empty answer as unknown, with nothing confirmed', () => {
    expect(toCheckResult({})).toEqual({
      status: 'UNKNOWN',
      reason: '',
      syntaxValid: false,
      hasMx: false,
      deliverable: false,
      catchAll: false,
      disposable: false,
      roleAccount: false,
      suggestion: '',
    });
  });

  it.each([
    [{ is_reachable: 'invalid', syntax: { is_valid_syntax: false } }, 'INVALID', 'Not a valid email address'],
    [{ is_reachable: 'invalid', mx: { accepts_mail: false } }, 'INVALID', 'The domain does not receive email'],
    [{ is_reachable: 'risky', smtp: { is_disabled: true, is_deliverable: false } }, 'RISKY', 'The mailbox is disabled'],
    [{ is_reachable: 'risky', smtp: { has_full_inbox: true } }, 'RISKY', 'The mailbox is full'],
    [{ is_reachable: 'unknown', smtp: { can_connect_smtp: false } }, 'UNKNOWN', 'The mail server could not be reached'],
    [{ is_reachable: 'risky', misc: { is_disposable: true }, smtp: { is_deliverable: true } }, 'RISKY', 'A disposable address'],
    [{ is_reachable: 'risky', smtp: { is_catch_all: true, is_deliverable: true } }, 'RISKY', 'The domain accepts every address (catch-all)'],
    [{ is_reachable: 'risky', misc: { is_role_account: true }, smtp: { is_deliverable: true } }, 'RISKY', 'A role address (info@, sales@ …)'],
    [{ is_reachable: 'invalid', smtp: { is_deliverable: false } }, 'INVALID', 'The mailbox does not exist'],
  ] as const)('gives the most telling reason first (%#)', (output, status, reason) => {
    expect(toCheckResult(output)).toMatchObject({ status, reason });
  });
});

describe('checkWithReacher', () => {
  it('asks the Reacher container about the address, through the proxy when one is set', async () => {
    const calls = fakeReacher();
    const proxy = { host: 'proxy.example.test', port: 1080, username: 'u', password: 'p' };

    await expect(checkWithReacher('asha@acme.test', proxy)).resolves.toMatchObject({
      status: 'VERIFIED',
    });

    expect(calls).toEqual([
      { url: `${env.reacherUrl}/v0/check_email`, to_email: 'asha@acme.test', proxy },
    ]);
  });

  it('sends no proxy when none is configured', async () => {
    const calls = fakeReacher();

    await checkWithReacher('asha@acme.test', null);

    expect(calls[0]).not.toHaveProperty('proxy');
  });

  it('throws on an HTTP error, naming the status', async () => {
    fakeReacher({ 'asha@acme.test': { status: 503 } });

    await expect(checkWithReacher('asha@acme.test', null)).rejects.toThrow(
      'The email verifier answered HTTP 503',
    );
  });
});
