import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';

export interface GraphQLContext {
  user: TokenPayload | null;
}

/** Builds the per-request GraphQL context by decoding the Bearer token. */
export function buildContext({ req }: { req: Request }): GraphQLContext {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? verifyToken(token) : null;
  return { user };
}
