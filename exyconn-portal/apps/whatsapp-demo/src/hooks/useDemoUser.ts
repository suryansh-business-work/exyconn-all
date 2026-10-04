import { useMemo } from 'react';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useMeQuery } from '@exyconn/shell/graphql/generated';
import type { DemoUser } from '@exyconn/wa-flow/engine';
import { useVisitor } from '../visitor/useVisitor';

const SPACES = /\s+/;

/**
 * Who the demos address — the one real thing in a demo chat: the signed-in portal user, or the
 * demo visitor who signed in with an emailed code.
 */
export function useDemoUser(): DemoUser & { id: string } {
  const { user } = useAuth();
  const { data } = useMeQuery({ fetchPolicy: 'cache-first', skip: !user });
  const { visitor } = useVisitor();
  return useMemo(() => {
    const person = user ? data?.me : visitor;
    const fullName = (person?.name ?? user?.name ?? '').trim();
    return {
      id: user?.id ?? visitor?.id ?? '',
      fullName,
      firstName: fullName.split(SPACES)[0] ?? '',
      email: person?.email ?? user?.email ?? '',
      phone: person?.phone ?? '',
    };
  }, [data, user, visitor]);
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
