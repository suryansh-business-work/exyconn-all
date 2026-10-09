/**
 * Hands a hand-built stand-in to a mock whose parameter is a full framework type
 * (a Mongoose query, a GraphQL request context). One typed seam instead of an inline
 * assertion at every call site.
 */
export const asArg = (value: unknown): never => value as never;
