import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useFormatters } from '@exyconn/i18n';
import { dateColumn, statusColumn, textColumn, usePagedFetcher } from '@exyconn/crud';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import {
  EmailVerificationsPagedDocument,
  type EmailVerificationFieldsFragment,
  type EmailVerificationsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { EmailStatusBadge } from '../../email-verification';

type Row = EmailVerificationFieldsFragment;

function StatusCell({ data }: Readonly<ICellRendererParams<Row>>) {
  return data ? <EmailStatusBadge verification={data} /> : null;
}

const COLUMNS: ColDef<Row>[] = [
  textColumn<Row>('email', 'Email'),
  { ...statusColumn<Row>('status', 'Result'), cellRenderer: StatusCell },
  textColumn<Row>('reason', 'Why'),
  statusColumn<Row>('source', 'Checked from'),
  textColumn<Row>('checkedBy', 'Checked by'),
  dateColumn<Row>('checkedAt', 'Checked'),
];

/** Every address checked, with its latest result — searchable, filterable, exportable. */
export function RecordsPanel() {
  const { formatDateTime } = useFormatters();
  const fetchRows = usePagedFetcher(
    EmailVerificationsPagedDocument,
    (data: EmailVerificationsPagedQuery) => data.emailVerificationsPaged,
  );
  return (
    <ServerDataGrid
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={{ actions: {}, formatDate: formatDateTime }}
      searchPlaceholder="Search by email, reason or who checked it…"
    />
  );
}
