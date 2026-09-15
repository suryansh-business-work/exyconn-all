import type { GetUserQuery } from '@/graphql/generated';

/** A fully-loaded user record as returned by the GetUser query. */
export type UserDetail = GetUserQuery['getUser'];

/** ONLINE when the person used a portal or app in the last few minutes (decided by the API). */
export function presenceStatus(user: Readonly<{ isOnline: boolean }>): 'ONLINE' | 'OFFLINE' {
  return user.isOnline ? 'ONLINE' : 'OFFLINE';
}

/** Up to two initials for an avatar with no photo: "Exyconn Admin" → "EA". */
export function userInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Derives the display status of a user from its active/blocked flags. */
export function userStatus(user: Pick<UserDetail, 'isActive' | 'isBlocked'>): string {
  if (user.isBlocked) return 'BLOCKED';
  return user.isActive ? 'ACTIVE' : 'INACTIVE';
}
