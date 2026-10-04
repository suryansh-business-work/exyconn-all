import type { ColDef } from 'ag-grid-community';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import {
  DELETE_ACTION,
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { GridTranslate } from '@exyconn/shell/components/data/gridContext';
import {
  WhatsappDemoVisitorSource,
  type WhatsappDemoVisitorsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type WhatsappLeadRow =
  WhatsappDemoVisitorsPagedQuery['whatsappDemoVisitorsPaged']['rows'][number];

export type WhatsappLeadsGridContext = DatedCrudGridContext<WhatsappLeadRow>;

/** Switching a visitor off retires their demo pass at once. */
const BLOCK_ACTION: RowActionSpec = {
  key: 'block',
  label: 'block demo access',
  icon: BlockIcon,
  color: 'warning',
  hidden: (row: WhatsappLeadRow) => row.blocked,
};

const UNBLOCK_ACTION: RowActionSpec = {
  key: 'unblock',
  label: 'allow demo access again',
  icon: RestoreIcon,
  color: 'success',
  hidden: (row: WhatsappLeadRow) => !row.blocked,
};

/** Where the visitor first asked for a code. */
function sourceLabel(row: WhatsappLeadRow, t: GridTranslate): string {
  return row.source === WhatsappDemoVisitorSource.Website ? t('Website') : t('Demo sign-in');
}

/**
 * Column model for the WhatsApp demo's leads: who signed up, whether they ever entered their
 * code, and how often they came back. Name, email, company and phone are what the list is
 * searched by.
 */
export const WHATSAPP_LEAD_COLUMNS: ColDef<WhatsappLeadRow>[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  textColumn('company', 'Company'),
  textColumn('phone', 'Phone'),
  derivedColumn('sourceLabel', 'Source', sourceLabel),
  dateColumn('verifiedAt', 'Verified', 'Not yet'),
  valueColumn('signInCount', 'Sign-ins', (row) => String(row.signInCount)),
  dateColumn('lastSignInAt', 'Last sign-in', '—'),
  boolColumn('blocked', 'Blocked'),
  dateColumn('createdAt', 'Signed up'),
  actionsColumn([BLOCK_ACTION, UNBLOCK_ACTION, DELETE_ACTION]),
];
