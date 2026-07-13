import type { GetUserQuery } from '../../../../graphql/generated';

/** A fully-loaded user record as returned by the GetUser query. */
export type UserDetail = GetUserQuery['getUser'];

/** Derives the display status of a user from its active/blocked flags. */
export function userStatus(user: Pick<UserDetail, 'isActive' | 'isBlocked'>): string {
  if (user.isBlocked) return 'BLOCKED';
  return user.isActive ? 'ACTIVE' : 'INACTIVE';
}
