/**
 * Shared pieces for the company form tests: the CMS catalogue's default copy (what a migrated
 * page was seeded with) and a fetch stand-in for the captcha and form-submit routes.
 */
import { vi } from "vitest";
import { cmsComponent } from "@exyconn/cms";
import type { OrderAgentsText } from "../../../../src/components/company/order-agents";
import type { QuoteText } from "../../../../src/components/company/quote";
import type { Agent } from "../../../../src/lib/company/agents";

function cmsDefaults<T>(key: string): T {
  const component = cmsComponent(key);
  if (!component) {
    throw new Error(`No CMS component "${key}".`);
  }
  return component.defaultProps as T;
}

export const agentsPage = cmsDefaults<{ agents: Agent[]; text: OrderAgentsText }>("agents.order");
export const quoteText = cmsDefaults<{ text: QuoteText }>("company.quote").text;

export interface RouteReply {
  status: number;
  body?: unknown;
}

const reply = ({ status, body = {} }: RouteReply) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

/**
 * Stubs fetch: /api/captcha hands out question n as "n + 1" with token "token-n", and every
 * other route answers with `submit()`.
 */
export function mockFormFetch(submit: () => RouteReply = () => ({ status: 200 })) {
  let questions = 0;
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
    if (url === "/api/captcha") {
      questions += 1;
      return reply({
        status: 200,
        body: { token: `token-${questions}`, question: `${questions} + 1` },
      });
    }
    return reply(submit());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The JSON bodies posted to /api/form-submit, in order. */
export function postedForms(
  fetchMock: ReturnType<typeof mockFormFetch>
): Record<string, unknown>[] {
  return fetchMock.mock.calls
    .filter(([url]) => url === "/api/form-submit")
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>);
}
