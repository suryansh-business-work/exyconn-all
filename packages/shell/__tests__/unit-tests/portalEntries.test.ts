import { describe, it, expect } from 'vitest';
import { buildPortalEntries } from '../../src/layout/PortalSwitcher/portalEntries';
import { ROLES } from '../../src/auth/roles';

describe('buildPortalEntries', () => {
  it('always offers the hub plus every module the roles can open', () => {
    const entries = buildPortalEntries([ROLES.HR], 'hr');
    expect(entries.map((e) => e.key)).toEqual(['hub', 'hr']);
  });

  it('gives ADMIN every portal', () => {
    const entries = buildPortalEntries([ROLES.ADMIN], 'hub');
    expect(entries.length).toBeGreaterThan(13);
    expect(entries[0].key).toBe('hub');
  });

  it('marks only the asking app as current', () => {
    const entries = buildPortalEntries([ROLES.ADMIN], 'finance');
    expect(entries.filter((e) => e.isCurrent).map((e) => e.key)).toEqual(['finance']);
  });

  it('filters on label and description, case-insensitively', () => {
    const byLabel = buildPortalEntries([ROLES.ADMIN], 'hub', 'TRACK');
    expect(byLabel.every((e) => /track/i.test(`${e.label} ${e.description}`))).toBe(true);
    expect(byLabel.length).toBeGreaterThan(0);

    const byDescription = buildPortalEntries([ROLES.ADMIN], 'hub', 'invoices');
    expect(byDescription.map((e) => e.key)).toEqual(['finance']);
  });

  it('returns nothing when the query matches no portal', () => {
    expect(buildPortalEntries([ROLES.ADMIN], 'hub', 'zzzznope')).toEqual([]);
  });
});
