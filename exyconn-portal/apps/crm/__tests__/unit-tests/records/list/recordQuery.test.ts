import { describe, expect, it } from 'vitest';
import { CrmOp, SortDir } from '@exyconn/shell/graphql/generated';
import {
  EMPTY_QUERY,
  conditionCount,
  newId,
  queryOfView,
  sameNear,
  sameQuery,
  toGroupInputs,
  toSnapshot,
  toSortInputs,
  withoutCondition,
  type FilterGroup,
} from '../../../../src/records/list/recordQuery';
import { crmView } from '../records-fixtures';

const GROUPS: FilterGroup[] = [
  {
    id: 'g1',
    conditions: [
      { id: 'c1', property: 'stage', op: CrmOp.In, values: ['HOT'] },
      { id: 'c2', property: 'name', op: CrmOp.Contains, values: ['acme'] },
    ],
  },
  { id: 'g2', conditions: [{ id: 'c3', property: 'email', op: CrmOp.IsEmpty, values: [] }] },
  { id: 'g3', conditions: [] },
];

describe('recordQuery', () => {
  it('makes a fresh id each time', () => {
    expect(newId()).not.toBe(newId());
  });

  it('strips client ids and empty groups for the server', () => {
    expect(toGroupInputs(GROUPS)).toEqual([
      {
        conditions: [
          { property: 'stage', op: CrmOp.In, values: ['HOT'] },
          { property: 'name', op: CrmOp.Contains, values: ['acme'] },
        ],
      },
      { conditions: [{ property: 'email', op: CrmOp.IsEmpty, values: [] }] },
    ]);
  });

  it('strips the cache typename from sorts', () => {
    expect(
      toSortInputs([{ __typename: 'CrmSort', property: 'name', dir: SortDir.Desc } as never]),
    ).toEqual([{ property: 'name', dir: SortDir.Desc }]);
  });

  it('turns a saved view into a working query with fresh ids', () => {
    const view = crmView();
    const query = queryOfView(view);
    expect(query.search).toBe('acme');
    expect(query.columns).toEqual(['name', 'email']);
    expect(query.columns).not.toBe(view.columns);
    expect(query.sorts).toEqual([{ property: 'name', dir: SortDir.Asc }]);
    expect(query.groups).toHaveLength(1);
    expect(query.groups[0].id).toEqual(expect.any(String));
    expect(query.groups[0].conditions[0]).toEqual({
      id: expect.any(String),
      property: 'stage',
      op: CrmOp.In,
      values: ['HOT'],
    });
  });

  it('snapshots a query with the search trimmed', () => {
    expect(toSnapshot({ ...EMPTY_QUERY, search: '  acme ', groups: GROUPS.slice(1) })).toEqual({
      search: 'acme',
      groups: [{ conditions: [{ property: 'email', op: CrmOp.IsEmpty, values: [] }] }],
      sorts: [],
      columns: [],
    });
  });

  it('compares queries by what they ask for, not by ids or spacing', () => {
    const a = queryOfView(crmView());
    const b = { ...queryOfView(crmView()), search: ' acme ' };
    expect(sameQuery(a, b)).toBe(true);
    expect(sameQuery(a, { ...b, columns: ['name'] })).toBe(false);
  });

  it('compares near circles, treating a missing one as none', () => {
    const near = { lat: 1, lng: 2, radiusKm: 5, label: '' };
    expect(sameNear(undefined, null)).toBe(true);
    expect(sameNear(near, { ...near })).toBe(true);
    expect(sameNear(near, { ...near, radiusKm: 10 })).toBe(false);
    expect(sameNear(near, null)).toBe(false);
  });

  it('counts the active conditions', () => {
    expect(conditionCount(GROUPS)).toBe(3);
    expect(conditionCount([])).toBe(0);
  });

  it('removes one condition and any group it leaves empty', () => {
    expect(withoutCondition(GROUPS, 'c3').map((group) => group.id)).toEqual(['g1']);
    expect(withoutCondition(GROUPS, 'c1')[0].conditions.map((c) => c.id)).toEqual(['c2']);
  });
});
