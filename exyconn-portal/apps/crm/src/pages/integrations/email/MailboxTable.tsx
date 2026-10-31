import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SyncIcon from '@mui/icons-material/Sync';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { MailboxActionsByProvider, MailboxRow } from './mailboxes';
import { LastActivityCell, MailboxCell, MailboxStatusCell, UseForCrmSwitch } from './MailboxCells';
import { domainOf, HealthScoreChip, type DomainHealth } from './health';

interface MailboxTableProps {
  rows: MailboxRow[];
  loading: boolean;
  actions: MailboxActionsByProvider;
  /** Each sending domain's last health check, for the Health column. */
  healthDomains: readonly DomainHealth[];
  onRefresh: () => Promise<unknown>;
  /** Opens the full text of a mailbox's last error. */
  onViewDetails: (row: MailboxRow) => void;
}

const logFailure = (error: unknown) => portalLogger.warn('crm: mailbox action failed', error);

function mailboxColumns(
  actions: MailboxActionsByProvider,
  healthDomains: readonly DomainHealth[],
): Column<MailboxRow>[] {
  const scores = new Map(healthDomains.map((entry) => [entry.domain, entry.score]));
  return [
    { key: 'email', label: 'Mailbox', render: (row) => <MailboxCell row={row} /> },
    { key: 'status', label: 'Status', render: (row) => <MailboxStatusCell row={row} /> },
    {
      key: 'health',
      label: 'Health',
      render: (row) => <HealthScoreChip score={scores.get(domainOf(row.email))} />,
    },
    {
      key: 'enabled',
      label: 'Use for CRM',
      render: (row) => <UseForCrmSwitch row={row} actions={actions[row.provider]} />,
    },
    {
      key: 'lastActivityAt',
      label: 'Last activity',
      render: (row) => <LastActivityCell row={row} />,
    },
    { key: 'connectedByName', label: 'Connected by' },
  ];
}

/** Details (only with an error), Test, Reconnect and Disconnect — which asks first. */
function mailboxRowActions(
  actions: MailboxActionsByProvider,
  onViewDetails: (row: MailboxRow) => void,
): RowAction<MailboxRow>[] {
  return [
    {
      icon: <InfoOutlinedIcon fontSize="small" />,
      tooltip: 'View error details',
      ariaLabel: 'View error details',
      color: 'error',
      onClick: onViewDetails,
      hidden: (row) => !row.lastError,
    },
    {
      icon: <NetworkCheckIcon fontSize="small" />,
      tooltip: 'Test the mailbox',
      ariaLabel: 'Test the mailbox',
      color: 'primary',
      onClick: (row) => actions[row.provider].test(row.account).catch(logFailure),
    },
    {
      icon: <SyncIcon fontSize="small" />,
      tooltip: 'Reconnect the mailbox',
      ariaLabel: 'Reconnect the mailbox',
      onClick: (row) => actions[row.provider].connect(row.email).catch(logFailure),
    },
    {
      icon: <LinkOffIcon fontSize="small" />,
      tooltip: 'Disconnect the mailbox',
      ariaLabel: 'Disconnect the mailbox',
      color: 'error',
      onClick: (row) => actions[row.provider].remove(row.account).catch(logFailure),
    },
  ];
}

/** Every connected mailbox, Gmail and Microsoft alike, in one table. */
export function MailboxTable({
  rows,
  loading,
  actions,
  healthDomains,
  onRefresh,
  onViewDetails,
}: Readonly<MailboxTableProps>) {
  return (
    <DataTable
      columns={mailboxColumns(actions, healthDomains)}
      rows={rows}
      actions={mailboxRowActions(actions, onViewDetails)}
      loading={loading}
      onRefresh={onRefresh}
      emptyMessage="No mailbox connected yet. Connect a Gmail or Microsoft account to email contacts and companies from the CRM."
    />
  );
}
