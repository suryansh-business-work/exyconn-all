import type { ColDef } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  DELETE_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  textColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListOnboardingChecklistsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedOnboardingChecklistRow =
  ListOnboardingChecklistsPagedQuery['listOnboardingChecklistsPaged']['rows'][number];

export type OnboardingGridContext = DatedCrudGridContext<PagedOnboardingChecklistRow>;

export const DETAILS_ACTION: RowActionSpec = {
  key: 'details',
  label: 'open checklist',
  icon: InfoOutlinedIcon,
  color: 'primary',
};

/** "3 of 6 done (50%)" reads faster in a grid than a bare percentage. */
export function progressLabel(row: PagedOnboardingChecklistRow): string {
  const done = row.items.filter((item) => item.done).length;
  return `${done} of ${row.items.length} done (${row.progressPercent}%)`;
}

/** Finished or still going — the one thing HR scans this grid for. */
function statusOf(row: PagedOnboardingChecklistRow): string {
  return row.complete ? 'COMPLETE' : 'IN_PROGRESS';
}

export const ONBOARDING_COLUMNS: ColDef<PagedOnboardingChecklistRow>[] = [
  textColumn('employeeName', 'Employee'),
  textColumn('templateName', 'Template'),
  dateColumn('joinDate', 'Joined'),
  derivedColumn('progress', 'Progress', progressLabel),
  derivedStatusColumn('state', 'State', statusOf),
  actionsColumn([DETAILS_ACTION, DELETE_ACTION]),
];
