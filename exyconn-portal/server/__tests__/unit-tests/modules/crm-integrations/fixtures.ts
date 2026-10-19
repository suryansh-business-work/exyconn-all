import { Types } from 'mongoose';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

/** A Twilio Account SID in the shape Twilio issues (AC + 32 hex digits). */
export const TWILIO_SID = `AC${'0123456789abcdef'.repeat(2)}`;
/** Long enough for a hint (the last four characters) to be kept. */
export const AUTH_TOKEN = 'token-for-tests-0001';
export const COMPANY_NUMBER = '+14155550100';
export const AGENT_PHONE = '+14155550111';
export const CONTACT_PHONE = '+919876543210';

export const twilioInput = (overrides: Record<string, unknown> = {}) => ({
  provider: 'TWILIO',
  label: 'Main line',
  fromNumber: COMPANY_NUMBER,
  accountId: TWILIO_SID,
  authToken: AUTH_TOKEN,
  isActive: true,
  ...overrides,
});

export const vobizInput = (overrides: Record<string, unknown> = {}) => ({
  ...twilioInput(),
  provider: 'VOBIZ',
  label: 'Vobiz line',
  accountId: 'MA_VOBIZ01',
  ...overrides,
});

export const msg91Input = (overrides: Record<string, unknown> = {}) => ({
  provider: 'MSG91',
  label: 'MSG91 texts',
  authToken: AUTH_TOKEN,
  senderId: 'EXYCON',
  templateId: 'flow-123',
  messageVariable: 'message',
  isActive: true,
  ...overrides,
});

/** A signed-in CRM user with a real-looking id (actorNameOf reads the users collection). */
export const crmUser = (roles: Role[] = [ROLES.CRM]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), roles, email: 'sales@exyconn.com' },
});

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const textResponse = (body: string, status = 200) => new Response(body, { status });

/** Answers fetch calls with these responses, in order. */
export function fakeFetch(...responses: Response[]) {
  const spy = jest.spyOn(globalThis, 'fetch');
  for (const response of responses) {
    spy.mockResolvedValueOnce(response);
  }
  return spy;
}

type FetchSpy = ReturnType<typeof fakeFetch>;

/** The URL the n-th fetch call went to. */
export function fetchedUrl(spy: FetchSpy, n = 0): string {
  const input = spy.mock.calls[n][0];
  if (typeof input !== 'string') throw new Error('Expected a URL string');
  return input;
}

/** The n-th fetch call's JSON body. */
export function jsonBody(spy: FetchSpy, n = 0): Record<string, unknown> {
  const body = spy.mock.calls[n][1]?.body;
  if (typeof body !== 'string') throw new Error('Expected a JSON body');
  return JSON.parse(body);
}

/** The n-th fetch call's form body. */
export function formBody(spy: FetchSpy, n = 0): URLSearchParams {
  const body = spy.mock.calls[n][1]?.body;
  if (!(body instanceof URLSearchParams)) throw new Error('Expected a form body');
  return body;
}

/** The n-th fetch call's headers. */
export const fetchedHeaders = (spy: FetchSpy, n = 0) =>
  spy.mock.calls[n][1]?.headers as Record<string, string>;
