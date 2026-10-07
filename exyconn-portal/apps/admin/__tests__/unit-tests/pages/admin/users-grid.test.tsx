import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { USER_COLUMNS, type PagedUserRow } from '../../../../src/pages/admin/users-grid';

type Getter = (params: ValueGetterParams<PagedUserRow>) => unknown;
type RolesCell = ComponentType<Partial<ICellRendererParams<PagedUserRow>>>;

const column = (id: string): ColDef<PagedUserRow> => {
  const found = USER_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

/** Runs a column's value getter the way ag-grid does, with the shared translator on context. */
const getValue = (id: string, data: Partial<PagedUserRow> | undefined) =>
  (column(id).valueGetter as Getter)({
    data,
    context: { t: (source: string) => source },
  } as ValueGetterParams<PagedUserRow>);

describe('USER_COLUMNS', () => {
  it('lists name, email, roles, status and the row actions, in that order', () => {
    expect(USER_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'name',
      'email',
      'roles',
      'status',
      'actions',
    ]);
    expect(column('name').headerName).toBe('Name');
    expect(column('email').headerName).toBe('Email');
  });

  it('keeps roles out of the server sort and filter, which only know name and email', () => {
    expect(column('roles')).toMatchObject({
      sortable: false,
      filter: false,
      floatingFilter: false,
    });
  });

  it('draws each role a user holds as a chip, and nothing for a row still loading', () => {
    const Cell = column('roles').cellRenderer as RolesCell;
    const { unmount } = render(<Cell data={{ roles: ['ADMIN', 'HR'] } as PagedUserRow} />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
    unmount();

    const { container } = render(<Cell data={undefined} />);
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(0);
  });

  it('derives the status from the blocked and active flags', () => {
    expect(getValue('status', { isActive: true, isBlocked: true })).toBe('BLOCKED');
    expect(getValue('status', { isActive: true, isBlocked: false })).toBe('ACTIVE');
    expect(getValue('status', { isActive: false, isBlocked: false })).toBe('INACTIVE');
    expect(getValue('status', undefined)).toBeNull();
  });

  it('offers edit, reset password and delete on every row', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => [spec.key, spec.label])).toEqual([
      ['edit', 'edit'],
      ['reset', 'reset password'],
      ['delete', 'delete'],
    ]);
  });
});
