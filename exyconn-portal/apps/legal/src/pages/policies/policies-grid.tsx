import type { ColDef } from 'ag-grid-community';
import PublishIcon from '@mui/icons-material/Publish';
import PeopleIcon from '@mui/icons-material/People';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  DELETE_ACTION,
  EDIT_ACTION,
  type DatedCrudGridContext,
} from '@exyconn/crud';
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

/** How far through the workforce a policy has got, at a glance. */
function signedLabel(row: PagedPolicyRow): string {
  if (!row.requiresAcknowledgement) {
    return 'Not required';
  }
  return `${row.acknowledgedCount} signed`;
}

export const POLICY_COLUMNS: ColDef<PagedPolicyRow>[] = [
  textColumn('title', 'Title'),
  textColumn('slug', 'Slug'),
  statusColumn('audience', 'Audience'),
  statusColumn('status', 'Status'),
  derivedColumn('version', 'Version', (row) => `v${row.version}`),
  boolColumn('requiresAcknowledgement', 'Sign'),
  derivedColumn('signed', 'Signatures', signedLabel),
  dateColumn('effectiveDate', 'Effective'),
  actionsColumn<PagedPolicyRow>([PUBLISH_ACTION, SIGNERS_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
