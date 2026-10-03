import { useMemo } from 'react';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useMeQuery } from '@exyconn/shell/graphql/generated';
import type { DemoUser } from '@exyconn/wa-flow/engine';

const SPACES = /\s+/;

/** The signed-in portal user as the demos address them — the one real thing in a demo chat. */
export function useDemoUser(): DemoUser & { id: string } {
  const { user } = useAuth();
  const { data } = useMeQuery({ fetchPolicy: 'cache-first' });
  return useMemo(() => {
    const fullName = (data?.me?.name ?? user?.name ?? '').trim();
    return {
      id: user?.id ?? 'guest',
      fullName,
      firstName: fullName.split(SPACES)[0] ?? '',
      email: data?.me?.email ?? user?.email ?? '',
      phone: data?.me?.phone ?? '',
    };
  }, [data, user]);
}

/** "Asha Nair" -> "AN". */
export function initialsOf(name: string): string {
  return name
    .split(SPACES)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
