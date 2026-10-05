import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { env } from './env';
import { activityLink, BACKGROUND_REQUEST } from './networkActivity';
import { tokenStore } from '@/auth/tokenStore';
import { CURRENT_ORGANIZATION_SLUG, ORGANIZATION_HEADER } from './organizationPath';
import { ReportClientLogsDocument } from '@/graphql/generated';
import { setLogTransport } from '@/logging/portalLogger';
import { reportApolloError } from '@/logging/reportApolloError';

/** Single ApolloClient instance shared across the app (singleton). */
const httpLink = createHttpLink({ uri: env.graphqlUrl });

// The company the address names travels with every request; the API decides whether the
// caller may work in it (only a SUPER_ADMIN may leave their own).
const organizationHeader = CURRENT_ORGANIZATION_SLUG
  ? { [ORGANIZATION_HEADER]: CURRENT_ORGANIZATION_SLUG }
  : {};

/** Headers one app adds to every request of its own (the WhatsApp demo's visitor pass). */
let appHeaders: () => Record<string, string> = () => ({});
/**
 * Whether this app speaks with the portal session (the shared `.exyconn.com` cookie). The client
 * hub does not: its contacts are not portal users, and an employee who happens to be signed in
 * must neither have their session sent from the hub nor cleared by the hub's sign-outs.
 */
let portalSession = true;

/** Stops this app sending — or clearing — the shared portal session. */
export function withoutPortalSession(): void {
  portalSession = false;
}

/** Lets an app add its own request headers; the WhatsApp demo sends its visitor pass this way. */
export function setAppRequestHeaders(provider: () => Record<string, string>): void {
  appHeaders = provider;
}

const authLink = setContext((_operation, { headers }) => {
  const token = portalSession ? tokenStore.get() : null;
  return {
    headers: {
      ...headers,
      ...organizationHeader,
      ...appHeaders(),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Apollo 4 hands the handler one `error` rather than separate GraphQL and network lists;
// the GraphQL errors are inside it when it is a CombinedGraphQLErrors.
const errorLink = onError(({ error, operation }) => {
  reportApolloError(error, operation.operationName);
  if (!CombinedGraphQLErrors.is(error)) {
    return;
  }
  const unauthenticated = error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');
  if (unauthenticated && portalSession) {
    tokenStore.clear();
  }
});

export const apolloClient = new ApolloClient({
  link: from([activityLink, errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
});

setLogTransport((batch) =>
  apolloClient.mutate({
    mutation: ReportClientLogsDocument,
    variables: { input: batch },
    context: BACKGROUND_REQUEST,
  }),
);
