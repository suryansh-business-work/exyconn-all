import { describe, expect, it } from 'vitest';
import { ItAccessStatus } from '@exyconn/shell/graphql/generated';
import { ACCESS_COLUMNS } from '../../../../src/pages/access/access-grid';
import { accessRow } from '../../core/rows.fixtures';
import { actionKeys, formatCell, headersOf, visibleActions } from '../../core/grid.helpers';

const actionsFor = (status: ItAccessStatus) =>
  visibleActions(ACCESS_COLUMNS, accessRow({ status }));

describe('ACCESS_COLUMNS', () => {
  it('reads employee, application, kind, level, status, decider and when it was raised', () => {
    expect(headersOf(ACCESS_COLUMNS)).toEqual([
      'Employee',
      'Application',
      'Request',
      'Level',
      'Status',
      'Decided by',
      'Raised',
      '',
    ]);
    expect(formatCell(ACCESS_COLUMNS, 'createdAt', accessRow(), '2026-10-01')).toBe(
      'on 2026-10-01',
    );
  });

  it('declares decide, fulfil, cancel, edit and delete in that order', () => {
    expect(actionKeys(ACCESS_COLUMNS)).toEqual(['decide', 'fulfil', 'cancel', 'edit', 'delete']);
  });

  it('lets a pending request be decided, cancelled, edited or deleted', () => {
    expect(actionsFor(ItAccessStatus.Pending)).toEqual(['decide', 'cancel', 'edit', 'delete']);
  });

  it('lets an approved request be carried out or cancelled, but no longer edited', () => {
    expect(actionsFor(ItAccessStatus.Approved)).toEqual(['fulfil', 'cancel', 'delete']);
  });

  it('leaves only delete once a request is finished', () => {
    expect(actionsFor(ItAccessStatus.Fulfilled)).toEqual(['delete']);
    expect(actionsFor(ItAccessStatus.Rejected)).toEqual(['delete']);
    expect(actionsFor(ItAccessStatus.Cancelled)).toEqual(['delete']);
  });
});
