/**
 * A fake site API behind `fetch` for the website form tests: numbered questions from
 * /api/captcha and a chosen reply for everything else. Replies are plain objects (not
 * `Response`), so nothing in a test waits on stream reading or timers.
 */
import { type Mock, vi } from "vitest";

export interface FakeReply {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

/** A reply with `status` and, when given, a JSON body (else reading it fails, like an HTML page). */
export const reply = (status: number, body?: unknown): FakeReply => ({
  ok: status >= 200 && status < 300,
  status,
  json: () =>
    body === undefined
      ? Promise.reject(new SyntaxError("Unexpected token"))
      : Promise.resolve(body),
});

export type FetchMock = Mock<(url: string, init?: RequestInit) => Promise<FakeReply>>;

/** Stubs `fetch`: question N is `N + 1 = ?` with token `token-N`; other URLs get `post()`. */
export function serveSite(
  post: (url: string) => FakeReply | Promise<FakeReply> = () => reply(200)
) {
  let questions = 0;
  const fetchMock: FetchMock = vi.fn(async (url: string) => {
    if (url === "/api/captcha") {
      questions += 1;
      return reply(200, { token: `token-${questions}`, question: `${questions} + 1 = ?` });
    }
    return post(url);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The JSON bodies `fetch` was sent at `url`. */
export function postedTo(fetchMock: FetchMock, url = "/api/form-submit") {
  return fetchMock.mock.calls
    .filter(([target]) => target === url)
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>);
}
