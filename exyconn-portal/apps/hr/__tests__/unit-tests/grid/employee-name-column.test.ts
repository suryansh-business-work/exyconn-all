import { describe, expect, it, vi } from 'vitest';
import { employeeNameColumn } from '../../../src/grid/employee-name-column';
import { formatCell } from '../harness/grid';

describe('employeeNameColumn', () => {
  const columns = [employeeNameColumn<{ employeeId: string }>()];

  it('resolves the employee id through the grid context lookup', () => {
    const nameOf = vi.fn(() => 'Asha Rao');

    expect(formatCell(columns, 'employeeName', { employeeId: 'user-1' }, { nameOf })).toBe(
      'Asha Rao',
    );
    expect(nameOf).toHaveBeenCalledWith('user-1');
  });

  it('writes nothing while the row is still loading', () => {
    const nameOf = vi.fn();

    expect(formatCell(columns, 'employeeName', undefined, { nameOf })).toBe('');
    expect(nameOf).not.toHaveBeenCalled();
  });

  it('offers neither sorting nor filtering, which the server cannot do on a name', () => {
    expect(columns[0]).toMatchObject({
      colId: 'employeeName',
      headerName: 'Employee',
      sortable: false,
      filter: false,
      floatingFilter: false,
    });
  });
});
