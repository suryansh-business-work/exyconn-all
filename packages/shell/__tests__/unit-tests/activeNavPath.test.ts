import { describe, it, expect } from 'vitest';
import { activeNavPath } from '@/layout/PortalLayout/activeNavPath';

const ADMIN_NAV = ['/admin', '/clients', '/environment-variables', '/admin/permissions'];

describe('activeNavPath', () => {
  it('matches the entry exactly when the URL is its own path', () => {
    expect(activeNavPath('/clients', ADMIN_NAV)).toBe('/clients');
  });

  it('keeps the parent entry for a tab slug beneath it', () => {
    expect(activeNavPath('/environment-variables/slack', ADMIN_NAV)).toBe('/environment-variables');
  });

  it('keeps the parent entry for a detail route beneath it', () => {
    expect(activeNavPath('/admin/users/42', ADMIN_NAV)).toBe('/admin');
  });

  it('prefers the longest matching entry over a shorter prefix', () => {
    expect(activeNavPath('/admin/permissions', ADMIN_NAV)).toBe('/admin/permissions');
  });

  it('does not match a sibling that merely shares a prefix', () => {
    expect(activeNavPath('/clients-archive', ADMIN_NAV)).toBeUndefined();
  });

  it('returns nothing when the URL is under no entry', () => {
    expect(activeNavPath('/somewhere-else', ADMIN_NAV)).toBeUndefined();
  });
});
