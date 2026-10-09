import { describe, expect, it } from 'vitest';
import { ItNetworkKind, ItServiceStatus } from '@exyconn/shell/graphql/generated';
import {
  networkItemSchema,
  toNetworkItemValues,
} from '../../../../../../src/pages/network/forms/network-item';
import { networkRow } from '../../../page-kit/fixtures';

const valid = { ...toNetworkItemValues(null), name: 'Office Wi-Fi' };

function firstError(value: unknown): string | null {
  const result = networkItemSchema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? 'invalid');
}

describe('networkItemSchema', () => {
  it('accepts a named item and trims what was typed', () => {
    expect(networkItemSchema.parse({ ...valid, address: ' 203.0.113.0/24 ' }).address).toBe(
      '203.0.113.0/24',
    );
  });

  it('wants a recognisable name of 2 to 120 characters', () => {
    expect(firstError({ ...valid, name: ' A ' })).toBe('Give it a name people will recognise');
    expect(firstError({ ...valid, name: 'x'.repeat(121) })).toBe('Too long');
    expect(firstError({ ...valid, name: 'x'.repeat(120) })).toBeNull();
  });

  it('caps the address, location, provider and notes', () => {
    expect(firstError({ ...valid, address: 'a'.repeat(201) })).toBe('Too long');
    expect(firstError({ ...valid, location: 'l'.repeat(121) })).toBe('Too long');
    expect(firstError({ ...valid, provider: 'p'.repeat(121) })).toBe('Too long');
    expect(firstError({ ...valid, notes: 'n'.repeat(2001) })).toBe(
      'Keep notes under 2000 characters',
    );
  });

  it('only takes kinds and statuses the server knows', () => {
    expect(firstError({ ...valid, kind: 'MODEM' })).not.toBeNull();
    expect(firstError({ ...valid, status: 'BROKEN' })).not.toBeNull();
  });
});

describe('toNetworkItemValues', () => {
  it('starts a new item as an active Wi-Fi network', () => {
    expect(toNetworkItemValues(null)).toEqual({
      name: '',
      kind: ItNetworkKind.Wifi,
      address: '',
      location: '',
      provider: '',
      status: ItServiceStatus.Active,
      notes: '',
    });
  });

  it('copies an existing item, leaving out the server bookkeeping', () => {
    const row = networkRow({ kind: ItNetworkKind.Vpn, status: ItServiceStatus.Down, notes: 'ISP' });
    expect(toNetworkItemValues(row)).toEqual({
      name: 'Office Wi-Fi',
      kind: ItNetworkKind.Vpn,
      address: 'exy-office',
      location: 'Pune',
      provider: 'Airtel',
      status: ItServiceStatus.Down,
      notes: 'ISP',
    });
  });
});
