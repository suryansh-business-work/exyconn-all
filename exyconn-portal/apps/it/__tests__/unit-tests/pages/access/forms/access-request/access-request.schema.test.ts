import { describe, expect, it } from 'vitest';
import { ItAccessKind } from '@exyconn/shell/graphql/generated';
import {
  LEVELLED_KINDS,
  accessRequestSchema,
  toAccessRequestInput,
  toAccessRequestValues,
} from '../../../../../../src/pages/access/forms/access-request/access-request.schema';
import { accessRow } from '../../../../core/rows.fixtures';

const valid = {
  employeeId: 'emp-1',
  application: 'Slack',
  kind: ItAccessKind.Grant,
  accessLevel: 'Editor',
  reason: 'Joins the support team',
  expiresAt: '',
};

const messages = (value: object) => {
  const result = accessRequestSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('accessRequestSchema', () => {
  it('only asks for a level on kinds that grant something', () => {
    expect([...LEVELLED_KINDS]).toEqual([ItAccessKind.Grant, ItAccessKind.RoleChange]);
  });

  it('accepts a grant that expires in the future', () => {
    expect(messages({ ...valid, expiresAt: '2099-01-01T00:00:00.000Z' })).toEqual([]);
  });

  it('needs an employee, an application and a reason', () => {
    expect(messages({ ...valid, employeeId: '', application: '   ', reason: 'why' })).toEqual([
      'Pick the employee',
      'Pick the application',
      'Say why it is needed',
    ]);
  });

  it('caps the level and the reason', () => {
    expect(messages({ ...valid, accessLevel: 'x'.repeat(61), reason: 'y'.repeat(501) })).toEqual([
      'Too long',
      'Too long',
    ]);
  });
});

describe('toAccessRequestInput', () => {
  it('keeps the level and expiry of a grant', () => {
    const input = toAccessRequestInput({ ...valid, expiresAt: '2099-01-01T00:00:00.000Z' });
    expect(input).toEqual({ ...valid, expiresAt: '2099-01-01T00:00:00.000Z' });
  });

  it('sends a grant with no expiry as null', () => {
    expect(toAccessRequestInput(valid).expiresAt).toBeNull();
  });

  it('drops the level of a revocation', () => {
    const input = toAccessRequestInput({ ...valid, kind: ItAccessKind.Revoke });
    expect(input).toMatchObject({ accessLevel: '', expiresAt: null });
  });
});

describe('toAccessRequestValues', () => {
  it('starts empty, as the kind the screen raises', () => {
    expect(toAccessRequestValues(null, ItAccessKind.PasswordReset)).toEqual({
      employeeId: '',
      application: '',
      kind: ItAccessKind.PasswordReset,
      accessLevel: '',
      reason: '',
      expiresAt: '',
    });
  });

  it('loads a saved request as it is, keeping its own kind', () => {
    const row = accessRow({ kind: ItAccessKind.RoleChange, expiresAt: '2099-01-01T00:00:00.000Z' });
    expect(toAccessRequestValues(row, ItAccessKind.Grant)).toEqual({
      employeeId: 'emp-1',
      application: 'Slack',
      kind: ItAccessKind.RoleChange,
      accessLevel: 'Editor',
      reason: 'Joins the support team',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
  });
});
