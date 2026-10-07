import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { seal } from '../../../../src/utils/secretBox';
import {
  SocialAccountModel,
  SocialAppConfigModel,
} from '../../../../src/modules/social-accounts/social.models';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import type { SocialApp } from '../../../../src/modules/social-accounts/social.constants';
import type { Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

/** One request the fake network saw. */
export interface Call {
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
}

/** A URL pattern, the status it answers with and the JSON body. */
export type Route = [RegExp, number, unknown];

/**
 * Stands in for every provider: each URL is answered by the first route that matches it, and
 * every request is recorded. An unmatched URL is refused, so a stray call shows up as a failure.
 */
export function fakeFetch(routes: Route[]): Call[] {
  const calls: Call[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    calls.push({
      url,
      method: init?.method ?? 'GET',
      body: String(init?.body ?? ''),
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    const hit = routes.find(([pattern]) => pattern.test(url));
    if (!hit) {
      return new Response(JSON.stringify({ error: { message: `unexpected ${url}` } }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify(hit[2]), { status: hit[1] });
  });
  return calls;
}

/** The form fields of a recorded POST. */
export const formOf = (call: Call): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(call.body));

/** App credentials made per run — never a literal secret. */
export const credentials = () => ({
  clientId: `client-${randomUUID()}`,
  clientSecret: `secret-${randomUUID()}`,
});

/** A provider app Tech has set up, written straight to the store. */
export const configureApp = (app: SocialApp, over: Record<string, unknown> = {}) =>
  runAsPlatform(() =>
    SocialAppConfigModel.create({ app, ...credentials(), enabled: true, ...over }),
  );

/** A connected account with a sealed token. */
export const connectAccount = (
  network: string,
  app: SocialApp,
  over: Record<string, unknown> = {},
) =>
  SocialAccountModel.create({
    network,
    app,
    externalId: `${network.toLowerCase()}-1`,
    name: network,
    accessToken: seal(`${network}-token`),
    connectedBy: 'u1',
    ...over,
  });

/** A composed post on an account, not yet sent. */
export const composedPost = (accountId: string, over: Record<string, unknown> = {}) =>
  SocialMediaPostModel.create({
    accountId,
    network: 'X',
    app: 'X',
    origin: 'COMPOSED',
    status: 'DRAFT',
    text: 'Hello',
    ...over,
  });

/** A signed-in caller, as the resolvers see one. */
export const ctxOf = (roles: Role[], organizationId?: string) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'm@exyconn.com', roles, organizationId },
    organizationId,
  }) as unknown as GraphQLContext;

export type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;

export const HOUR = 3_600_000;
