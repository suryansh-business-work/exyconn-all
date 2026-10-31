import { describe, expect, it } from 'vitest';
import { activeStatus } from '../../../src';

describe('activeStatus', () => {
  it('maps an active record to ACTIVE and an inactive one to INACTIVE', () => {
    expect(activeStatus({ isActive: true })).toBe('ACTIVE');
    expect(activeStatus({ isActive: false })).toBe('INACTIVE');
  });
});
