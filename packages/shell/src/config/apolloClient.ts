import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { env } from './env';
import { tokenStore } from '@/auth/tokenStore';
import { ReportClientLogsDocument } from '@/graphql/generated';
import { setLogTransport } from '@/logging/portalLogger';
import { reportApolloError } from '@/logging/reportApolloError';

/** Single ApolloClient instance shared across the app (singleton). */
const httpLink = createHttpLink({ uri: env.graphqlUrl });

const authLink = setContext((_operation, { headers }) => {
  const token = tokenStore.get();
  return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } };
});

// Apollo 4 hands the handler one `error` rather than separate GraphQL and network lists;
// the GraphQL errors are inside it when it is a CombinedGraphQLErrors.
const errorLink = onError(({ error, operation }) => {
  reportApolloError(error, operation.operationName);
  if (!CombinedGraphQLErrors.is(error)) {
    return;
  }
  const unauthenticated = error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');
  if (unauthenticated) {
    tokenStore.clear();
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
});

setLogTransport((batch) =>
  apolloClient.mutate({ mutation: ReportClientLogsDocument, variables: { input: batch } }),
);
