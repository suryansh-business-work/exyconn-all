import type { ColDef } from 'ag-grid-community';
import { textColumn } from '@exyconn/crud';
import { EmailCell, type EmailRow } from './EmailCell';

/** The email column every CRM grid uses: searchable and sortable, with its verification badge. */
export function emailColumn<TRow extends EmailRow>(headerName = 'Email'): ColDef<TRow> {
  return {
    ...textColumn<TRow>('email' as never, headerName),
    cellRenderer: EmailCell,
    minWidth: 280,
  };
}
