import { describe, expect, it } from 'vitest';
import { PermissionAction as A } from '@exyconn/shell/graphql/generated';
import {
  ACTIONS,
  effectiveActions,
  fillsOnToggle,
  rowStatus,
  sameActions,
  saveOperation,
  tickState,
  toggleAction,
} from '../../src/pages/permissions/permissions.logic';
import { actionLabel } from '../../src/pages/permissions/actionLabel';

describe('permissions logic', () => {
  it('orders the columns as people read access', () => {
    expect(ACTIONS).toEqual([A.View, A.Create, A.Edit, A.Delete, A.Approve, A.Export]);
  });

  it('reads no stored restriction as everything', () => {
    expect(effectiveActions(undefined)).toBe(ACTIONS);
    expect(effectiveActions([A.View])).toEqual([A.View]);
  });

  it('compares action lists regardless of order', () => {
    expect(sameActions([A.View, A.Edit], [A.Edit, A.View])).toBe(true);
    expect(sameActions([A.View], [A.View, A.Edit])).toBe(false);
    expect(sameActions([A.View, A.Create], [A.View, A.Edit])).toBe(false);
  });

  it('says whether a row or column is full, partly ticked or empty', () => {
    expect(tickState(0, 6)).toBe('none');
    expect(tickState(3, 6)).toBe('some');
    expect(tickState(6, 6)).toBe('all');
    expect(fillsOnToggle('none')).toBe(true);
    expect(fillsOnToggle('some')).toBe(true);
    expect(fillsOnToggle('all')).toBe(false);
  });

  it('toggles one action and keeps the column order', () => {
    expect(toggleAction([A.Export], A.View)).toEqual([A.View, A.Export]);
    expect(toggleAction([A.View, A.Export], A.View)).toEqual([A.Export]);
  });

  it('saves "everything" as back-to-default, anything less as a restriction', () => {
    expect(saveOperation([...ACTIONS].reverse())).toBe('reset');
    expect(saveOperation([A.View])).toBe('restrict');
  });

  it('names the row status, an unsaved change first', () => {
    expect(rowStatus(true, true)).toBe('Unsaved');
    expect(rowStatus(true, false)).toBe('Restricted');
    expect(rowStatus(false, false)).toBe('Default');
  });

  it('reads an action as a heading', () => {
    expect(actionLabel(A.Approve)).toBe('Approve');
  });
});
