import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { initialsOf, useDemoUser } from '../../../src/hooks/useDemoUser';

const who = vi.hoisted(() => ({
  user: null as null | { id: string; name: string; email: string },
  me: undefined as unknown,
  meOptions: undefined as unknown,
  visitor: null as null | { id: string; name: string; email: string; phone: string },
}));

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: who.user }) }));
vi.mock('@exyconn/shell/graphql/generated', () => ({
  useMeQuery: (options: unknown) => {
    who.meOptions = options;
    return { data: who.me };
  },
}));
vi.mock('../../../src/visitor/useVisitor', () => ({
  useVisitor: () => ({ visitor: who.visitor, loading: false }),
}));

beforeEach(() => {
  who.user = null;
  who.me = undefined;
  who.visitor = null;
});

describe('useDemoUser', () => {
  it('addresses the signed-in portal user by their profile', () => {
    who.user = { id: 'u-1', name: 'Old Name', email: 'old@example.com' };
    who.me = { me: { name: '  Asha  Nair ', email: 'asha@example.com', phone: '+91 98765 43210' } };
    const { result } = renderHook(() => useDemoUser());
    expect(result.current).toEqual({
      id: 'u-1',
      fullName: 'Asha  Nair',
      firstName: 'Asha',
      email: 'asha@example.com',
      phone: '+91 98765 43210',
    });
    expect(who.meOptions).toEqual({ fetchPolicy: 'cache-first', skip: false });
  });

  it('falls back to the session while the profile loads', () => {
    who.user = { id: 'u-1', name: 'Ravi Kumar', email: 'ravi@example.com' };
    const { result } = renderHook(() => useDemoUser());
    expect(result.current).toEqual({
      id: 'u-1',
      fullName: 'Ravi Kumar',
      firstName: 'Ravi',
      email: 'ravi@example.com',
      phone: '',
    });
  });

  it('addresses a demo visitor who signed in with an emailed code', () => {
    who.visitor = { id: 'v-1', name: 'Meera Iyer', email: 'meera@example.com', phone: '' };
    const { result } = renderHook(() => useDemoUser());
    expect(result.current).toEqual({
      id: 'v-1',
      fullName: 'Meera Iyer',
      firstName: 'Meera',
      email: 'meera@example.com',
      phone: '',
    });
    expect(who.meOptions).toEqual({ fetchPolicy: 'cache-first', skip: true });
  });

  it('is nobody before anyone has signed in', () => {
    const { result } = renderHook(() => useDemoUser());
    expect(result.current).toEqual({ id: '', fullName: '', firstName: '', email: '', phone: '' });
  });
});

describe('initialsOf', () => {
  it.each([
    ['Asha Nair', 'AN'],
    ['asha', 'A'],
    ['  meera   devi iyer ', 'MD'],
    ['', ''],
  ])('%j -> %j', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
