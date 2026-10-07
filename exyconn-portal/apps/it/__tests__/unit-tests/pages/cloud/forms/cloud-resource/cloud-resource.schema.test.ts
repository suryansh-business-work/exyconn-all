import { describe, expect, it } from 'vitest';
import { ItCloudKind, ItEnvironment, ItServiceStatus } from '@exyconn/shell/graphql/generated';
import {
  EXPIRING_KINDS,
  cloudResourceSchema,
  toCloudResourceInput,
  toCloudResourceValues,
} from '../../../../../../src/pages/cloud/forms/cloud-resource/cloud-resource.schema';
import { cloudRow } from '../../../../core/rows.fixtures';

const firstError = (value: object) => {
  const result = cloudResourceSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
};

const valid = { ...toCloudResourceValues(null), name: 'prod-db-1' };

describe('cloudResourceSchema', () => {
  it('treats domains and certificates as the kinds that lapse', () => {
    expect([...EXPIRING_KINDS]).toEqual([ItCloudKind.Domain, ItCloudKind.SslCertificate]);
  });

  it('accepts a server with no expiry, reading the cost as a number', () => {
    expect(cloudResourceSchema.parse({ ...valid, monthlyCost: '19.5' }).monthlyCost).toBe(19.5);
  });

  it('needs a domain to say when it expires', () => {
    expect(firstError({ ...valid, kind: ItCloudKind.Domain })).toBe(
      'A domain or certificate needs its expiry date',
    );
    expect(
      firstError({ ...valid, kind: ItCloudKind.Domain, expiresAt: '2027-03-01T00:00:00.000Z' }),
    ).toBeNull();
  });

  it('checks the name, the cost and the length of every text field', () => {
    expect(firstError({ ...valid, name: 'x' })).toBe('Give it a name people will recognise');
    expect(firstError({ ...valid, monthlyCost: 'a lot' })).toBe('Cost must be a number');
    expect(firstError({ ...valid, region: 'r'.repeat(61) })).toBe('Too long');
    expect(firstError({ ...valid, endpoint: 'e'.repeat(301) })).toBe('Too long');
    expect(firstError({ ...valid, notes: 'n'.repeat(2001) })).toBe(
      'Keep notes under 2000 characters',
    );
  });
});

describe('toCloudResourceInput', () => {
  it('sends an empty expiry as null and a set one as it is', () => {
    expect(toCloudResourceInput(valid).expiresAt).toBeNull();
    expect(toCloudResourceInput({ ...valid, expiresAt: '2027-03-01' }).expiresAt).toBe(
      '2027-03-01',
    );
  });
});

describe('toCloudResourceValues', () => {
  it('starts a new resource as an active production server', () => {
    expect(toCloudResourceValues(null)).toEqual({
      name: '',
      kind: ItCloudKind.Server,
      provider: '',
      environment: ItEnvironment.Production,
      region: '',
      endpoint: '',
      expiresAt: '',
      monthlyCost: 0,
      status: ItServiceStatus.Active,
      ownerName: '',
      notes: '',
    });
  });

  it('loads a saved resource, turning a missing expiry into a blank', () => {
    expect(toCloudResourceValues(cloudRow())).toEqual({
      name: 'prod-db-1',
      kind: ItCloudKind.Database,
      provider: 'Hetzner',
      environment: ItEnvironment.Production,
      region: 'eu-central',
      endpoint: 'db.internal',
      expiresAt: '',
      monthlyCost: 1200,
      status: ItServiceStatus.Active,
      ownerName: 'Meera',
      notes: '',
    });
  });
});
