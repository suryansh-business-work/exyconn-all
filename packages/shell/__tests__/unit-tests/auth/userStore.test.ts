import { describe, expect, it } from 'vitest';
import { env } from '@/config/env';
import { userStore } from '@/auth/userStore';
import { makeUser } from '../test-utils';

describe('userStore', () => {
  it('has no user before anyone signs in', () => {
    expect(userStore.get()).toBeNull();
  });

  it('round-trips the signed-in user through localStorage', () => {
    const user = makeUser({ roles: ['HR'], avatarUrl: null });
    userStore.set(user);

    expect(JSON.parse(localStorage.getItem(env.userStorageKey) ?? '')).toEqual(user);
    expect(userStore.get()).toEqual(user);
  });

  it('treats a corrupted entry as signed out instead of crashing', () => {
    localStorage.setItem(env.userStorageKey, '{not json');
    expect(userStore.get()).toBeNull();
  });

  it('forgets the user on clear', () => {
    userStore.set(makeUser());
    userStore.clear();

    expect(localStorage.getItem(env.userStorageKey)).toBeNull();
    expect(userStore.get()).toBeNull();
  });
});
