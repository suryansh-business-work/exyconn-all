import { GraphQLError } from 'graphql';

/** The GraphQL error code a resolver call settles with, or 'OK' when it succeeds. */
export async function codeOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return 'OK';
  } catch (error) {
    return error instanceof GraphQLError ? error.extensions.code : String(error);
  }
}
