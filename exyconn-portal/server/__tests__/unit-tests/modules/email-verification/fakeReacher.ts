/**
 * A stand-in for the Reacher container: each address gets the JSON Reacher would send, an HTTP
 * error status, or a refused connection. Records what the verifier asked for.
 */

/** What Reacher answers for one address. */
export type ReacherAnswer = Record<string, unknown> | { status: number } | 'down';

export interface ReacherCall {
  url: string;
  to_email: string;
  proxy?: { host: string; port: number; username?: string; password?: string };
}

const isStatus = (answer: ReacherAnswer): answer is { status: number } =>
  typeof answer === 'object' && typeof answer.status === 'number';

/** A deliverable mailbox, the way Reacher reports one. */
export const SAFE = {
  is_reachable: 'safe',
  syntax: { is_valid_syntax: true, suggestion: null },
  mx: { accepts_mail: true },
  smtp: { can_connect_smtp: true, is_deliverable: true, is_catch_all: false },
  misc: { is_disposable: false, is_role_account: false },
};

/** Installs the fake on fetch; an address with no answer is reported safe. */
export function fakeReacher(answers: Record<string, ReacherAnswer> = {}) {
  const calls: ReacherCall[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    const body = JSON.parse(String(init?.body)) as Omit<ReacherCall, 'url'>;
    calls.push({ url, ...body });
    const answer = answers[body.to_email] ?? SAFE;
    if (answer === 'down') {
      throw new TypeError('fetch failed');
    }
    if (isStatus(answer)) {
      return new Response('busy', { status: answer.status });
    }
    return new Response(JSON.stringify(answer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  return calls;
}
