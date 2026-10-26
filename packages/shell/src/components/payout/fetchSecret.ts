import type { ApolloClient, OperationVariables } from '@apollo/client';
import type { DocumentNode } from 'graphql';

/**
 * Fetches one sealed value for a reveal: always from the network and never cached, so a full
 * account number does not outlive the moment it was asked for. An empty answer reveals nothing.
 */
export async function fetchSecret<TData, TVariables extends OperationVariables>(
  client: ApolloClient,
  query: DocumentNode,
  variables: TVariables,
  pick: (data: TData) => string,
): Promise<string> {
  const { data } = await client.query<TData, TVariables>({
    query,
    variables,
    fetchPolicy: 'no-cache',
  });
  return data ? pick(data) : '';
}
