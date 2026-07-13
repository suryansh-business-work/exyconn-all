import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { env } from './env';
import { tokenStore } from '../auth/tokenStore';

/** Single ApolloClient instance shared across the app (singleton). */
const httpLink = createHttpLink({ uri: env.graphqlUrl });

const authLink = setContext((_operation, { headers }) => {
  const token = tokenStore.get();
  return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } };
});

const errorLink = onError(({ graphQLErrors }) => {
  const unauthenticated = graphQLErrors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED');
  if (unauthenticated) {
    tokenStore.clear();
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
});
