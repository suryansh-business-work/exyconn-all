import { describe, expect, it } from 'vitest';
import { presenceStatus, userInitials, userStatus } from '@/pages/UserDetails/user-details.types';

describe('presenceStatus', () => {
  it('reads the online flag the API decided', () => {
    expect(presenceStatus({ isOnline: true })).toBe('ONLINE');
    expect(presenceStatus({ isOnline: false })).toBe('OFFLINE');
  });
});

describe('userInitials', () => {
  it('takes at most two initials, upper-cased', () => {
    expect(userInitials('Exyconn Admin')).toBe('EA');
    expect(userInitials('ana maria lopez')).toBe('AM');
    expect(userInitials('Cher')).toBe('C');
  });

  it('gives nothing for an empty name', () => {
    expect(userInitials('')).toBe('');
  });
});

describe('userStatus', () => {
  it('puts a block ahead of the active flag', () => {
    expect(userStatus({ isActive: true, isBlocked: true })).toBe('BLOCKED');
  });

  it('otherwise reports active or inactive', () => {
    expect(userStatus({ isActive: true, isBlocked: false })).toBe('ACTIVE');
    expect(userStatus({ isActive: false, isBlocked: false })).toBe('INACTIVE');
  });
});
