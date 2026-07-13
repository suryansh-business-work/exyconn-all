import { GraphQLError } from 'graphql';

/** Throws a typed 401 error for unauthenticated requests. */
export function unauthenticated(message = 'Authentication required'): never {
  throw new GraphQLError(message, { extensions: { code: 'UNAUTHENTICATED' } });
}

/** Throws a typed 403 error for authorized-but-forbidden requests. */
export function forbidden(message = 'You do not have access to this resource'): never {
  throw new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });
}

/** Throws a typed 404 error when a resource is missing. */
export function notFound(resource: string): never {
  throw new GraphQLError(`${resource} not found`, { extensions: { code: 'NOT_FOUND' } });
}

/** Throws a typed 400 error for invalid input. */
export function badRequest(message: string): never {
  throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}
