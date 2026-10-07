import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ItChangeStatus,
  ItChangeType,
  ItEnvironment,
  ItRisk,
} from '@exyconn/shell/graphql/generated';
import {
  changeSchema,
  changeStatusOptions,
  toChangeValues,
} from '../../../../../../src/pages/changes/forms/change';
import { changeRow } from '../../../../core/rows.fixtures';

const firstError = (value: object) => {
  const result = changeSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
};

const valid = toChangeValues(changeRow());

describe('changeSchema', () => {
  it('accepts a complete change', () => {
    expect(firstError(valid)).toBeNull();
  });

  it('needs a window with both ends', () => {
    expect(firstError({ ...valid, plannedStart: '' })).toBe('When does it start?');
    expect(firstError({ ...valid, plannedEnd: '' })).toBe('When does it end?');
  });

  it('refuses a window that ends the moment it starts', () => {
    expect(firstError({ ...valid, plannedEnd: valid.plannedStart })).toBe(
      'The window must end after it starts',
    );
  });

  it('lets a non-production change go without a rollback plan', () => {
    expect(
      firstError({ ...valid, environment: ItEnvironment.Staging, rollbackPlan: '' }),
    ).toBeNull();
  });

  it('caps the system name and the owner', () => {
    expect(firstError({ ...valid, system: 'x'.repeat(121) })).toBe('Too long');
    expect(firstError({ ...valid, ownerName: 'y'.repeat(121) })).toBe('Too long');
    expect(firstError({ ...valid, system: 'x' })).toBe('Name the system being changed');
  });
});

describe('changeStatusOptions', () => {
  it('offers every undecided status to a new change', () => {
    expect(changeStatusOptions(null)).toEqual([
      ItChangeStatus.Draft,
      ItChangeStatus.Failed,
      ItChangeStatus.Implemented,
      ItChangeStatus.PendingApproval,
      ItChangeStatus.RolledBack,
      ItChangeStatus.Scheduled,
    ]);
  });

  it('keeps a rejected change rejected', () => {
    expect(changeStatusOptions(ItChangeStatus.Rejected)).toContain(ItChangeStatus.Rejected);
    expect(changeStatusOptions(ItChangeStatus.Rejected)).not.toContain(ItChangeStatus.Approved);
  });
});

describe('toChangeValues', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a new change now, for an hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T09:00:00.000Z'));
    expect(toChangeValues(null)).toEqual({
      title: '',
      description: '',
      type: ItChangeType.Normal,
      risk: ItRisk.Medium,
      environment: ItEnvironment.Production,
      system: '',
      status: ItChangeStatus.Draft,
      plannedStart: '2026-10-07T09:00:00.000Z',
      plannedEnd: '2026-10-07T10:00:00.000Z',
      ownerName: '',
      rollbackPlan: '',
    });
  });

  it('loads a saved change as it is', () => {
    expect(toChangeValues(changeRow())).toEqual({
      title: 'Upgrade Mongo',
      description: 'Minor version bump on the primary',
      type: ItChangeType.Normal,
      risk: ItRisk.Medium,
      environment: ItEnvironment.Production,
      system: 'Database',
      status: ItChangeStatus.PendingApproval,
      plannedStart: '2026-10-10T10:00:00.000Z',
      plannedEnd: '2026-10-10T11:00:00.000Z',
      ownerName: 'Meera',
      rollbackPlan: 'Restore the snapshot',
    });
  });
});
