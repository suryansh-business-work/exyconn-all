import type { ColDef } from 'ag-grid-community';
import PublishIcon from '@mui/icons-material/Publish';
import PeopleIcon from '@mui/icons-material/People';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  statusColumn,
  textColumn,
  DELETE_ACTION,
  EDIT_ACTION,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { GridTranslate } from '@exyconn/shell/components/data/gridContext';
import type { ListPoliciesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedPolicyRow = ListPoliciesPagedQuery['listPoliciesPaged']['rows'][number];
export type PoliciesGridContext = DatedCrudGridContext<PagedPolicyRow>;

/** Publishing is the act that puts a policy in front of people, so it leads the row. */
const PUBLISH_ACTION = {
  key: 'publish',
  label: 'publish',
  icon: PublishIcon,
  hidden: (row: PagedPolicyRow) => row.status === 'ARCHIVED',
};

/** Only worth opening once somebody could have signed. */
const SIGNERS_ACTION = {
  key: 'signers',
  label: 'who has signed',
  icon: PeopleIcon,
  hidden: (row: PagedPolicyRow) => !row.requiresAcknowledgement,
};

/**
 * Where a policy stands against its own review date — the whole reason for keeping one.
 *
 * The date itself is its own column, formatted through the viewer's settings; this says
 * what to do about it, which is what somebody scanning the register is looking for.
 */
function reviewState(row: PagedPolicyRow): string {
  if (row.reviewOverdue) {
    return 'OVERDUE';
  }
  return row.nextReviewOn ? 'SCHEDULED' : 'NOT SET';
}

/** How far through the workforce a policy has got, at a glance. */
function signedLabel(row: PagedPolicyRow, t: GridTranslate): string {
  if (!row.requiresAcknowledgement) {
    return t('Not required');
  }
  return t('{count} signed', { count: row.acknowledgedCount });
}

export const POLICY_COLUMNS: ColDef<PagedPolicyRow>[] = [
  textColumn('title', 'Title'),
  textColumn('slug', 'Slug'),
  statusColumn('audience', 'Audience'),
  statusColumn('status', 'Status'),
  derivedColumn('version', 'Version', (row) => `v${row.version}`),
  statusColumn('classification', 'Classification'),
  boolColumn('requiresAcknowledgement', 'Sign'),
  derivedColumn('signed', 'Signatures', signedLabel),
  dateColumn('effectiveDate', 'Effective'),
  dateColumn('nextReviewOn', 'Next review', '—'),
  derivedStatusColumn<PagedPolicyRow>('reviewState', 'Review', reviewState),
  actionsColumn<PagedPolicyRow>([PUBLISH_ACTION, SIGNERS_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
