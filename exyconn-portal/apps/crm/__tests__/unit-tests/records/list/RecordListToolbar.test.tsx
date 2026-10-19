import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CrmObject, CrmOp, SortDir } from '@exyconn/shell/graphql/generated';
import {
  RecordListToolbar,
  type RecordListToolbarSource,
} from '../../../../src/records/list';
import { EMPTY_QUERY } from '../../../../src/records/list/recordQuery';
import type { RecordQuery } from '../../../../src/records/list/useRecordQuery';
import { renderWithProviders } from '../../test-utils';
import { property } from '../records-fixtures';

/** Each toolbar control reduced to a button that reports what it would apply. */
const seen = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

function stub(name: string, payload: unknown) {
  return function Stub(props: Record<string, unknown>) {
    seen.props[name] = props;
    const handler = (props.onApply ?? props.onRemove) as ((value: unknown) => void) | undefined;
    return (
      <button type="button" onClick={() => handler?.(payload)}>
        {name}
      </button>
    );
  };
}

vi.mock('../../../../src/records/views/ViewBar', () => ({ ViewBar: stub('ViewBar', null) }));
vi.mock('../../../../src/records/filters/FiltersButton', () => ({
  FiltersButton: stub('Filters', [{ id: 'g', conditions: [] }]),
}));
vi.mock('../../../../src/records/filters/PresenceChips', () => ({
  PresenceChips: stub('Presence', []),
}));
vi.mock('../../../../src/records/filters/ActiveFilterChips', () => ({
  ActiveFilterChips: stub('Chips', 'c1'),
}));
vi.mock('../../../../src/records/list/sort', () => ({
  SortButton: stub('Sort', [{ property: 'name', dir: 'DESC' }]),
}));
vi.mock('../../../../src/records/columns/ColumnsButton', () => ({
  ColumnsButton: stub('Columns', ['email']),
}));

const GROUPS = [
  {
    id: 'g1',
    conditions: [
      { id: 'c1', property: 'stage', op: CrmOp.In, values: ['HOT'] },
      { id: 'c2', property: 'name', op: CrmOp.Contains, values: ['a'] },
    ],
  },
];

function source(error?: unknown) {
  const apply = vi.fn();
  const list = {
    query: { ...EMPTY_QUERY, groups: GROUPS, sorts: [{ property: 'name', dir: SortDir.Asc }] },
    apply,
  } as unknown as RecordQuery;
  const records: RecordListToolbarSource = {
    object: CrmObject.Lead,
    schema: { properties: [property()], fields: [property({ key: 'email' })], error },
    list,
    view: { choices: [], visible: ['name'], defaults: ['name'] },
    snapshot: { search: '', groups: [], sorts: [], columns: ['name'] },
  };
  return { records, apply };
}

describe('RecordListToolbar', () => {
  it('wires each control to the working query', async () => {
    const { records, apply } = source();
    const renderActions = vi.fn(() => <span>Actions</span>);
    renderWithProviders(
      <RecordListToolbar records={records} allLabel="All leads" renderActions={renderActions} />,
    );
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(renderActions).toHaveBeenCalledWith(records.snapshot);
    expect(seen.props.ViewBar).toMatchObject({ object: CrmObject.Lead, allLabel: 'All leads' });
    expect(seen.props.Sort.properties).toBe(records.schema.fields);
    expect(seen.props.Filters.properties).toBe(records.schema.properties);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Filters' }).click();
    expect(apply).toHaveBeenLastCalledWith({ groups: [{ id: 'g', conditions: [] }] });
    screen.getByRole('button', { name: 'Presence' }).click();
    expect(apply).toHaveBeenLastCalledWith({ groups: [] });
    screen.getByRole('button', { name: 'Sort' }).click();
    expect(apply).toHaveBeenLastCalledWith({ sorts: [{ property: 'name', dir: 'DESC' }] }, true);
    screen.getByRole('button', { name: 'Columns' }).click();
    expect(apply).toHaveBeenLastCalledWith({ columns: ['email'] });
    screen.getByRole('button', { name: 'Chips' }).click();
    expect(apply).toHaveBeenLastCalledWith({
      groups: [{ id: 'g1', conditions: [GROUPS[0].conditions[1]] }],
    });
  });

  it('warns when the properties could not be loaded and works without actions', () => {
    const { records } = source(new Error('down'));
    renderWithProviders(<RecordListToolbar records={records} allLabel="All leads" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the record properties, so filters and columns are limited.',
    );
  });
});
