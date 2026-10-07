import { describe, expect, it } from 'vitest';
import {
  EMPLOYEE_DOCUMENT_COLUMNS,
  type PagedEmployeeDocumentRow,
} from '../../../../src/pages/documents/employee-document-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

describe('EMPLOYEE_DOCUMENT_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(EMPLOYEE_DOCUMENT_COLUMNS)).toEqual([
      'employeeName',
      'title',
      'kind',
      'issuedOn',
      'actions',
    ]);
    expect(actionKeys(EMPLOYEE_DOCUMENT_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('names the employee through the grid context rather than showing the id', () => {
    const row = { id: 'row-1', employeeId: 'user-1' } as PagedEmployeeDocumentRow;
    const nameOf = (id: string) => (id === 'user-1' ? 'Asha Rao' : id);

    expect(formatCell(EMPLOYEE_DOCUMENT_COLUMNS, 'employeeName', row, { nameOf })).toBe('Asha Rao');
  });
});
