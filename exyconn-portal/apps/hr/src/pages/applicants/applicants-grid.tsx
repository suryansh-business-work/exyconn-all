import type { ColDef } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListApplicantsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedApplicantRow = ListApplicantsPagedQuery['listApplicantsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ApplicantsGridContext = DatedCrudGridContext<PagedApplicantRow>;

const ADVANCE_ACTION: RowActionSpec = {
  key: 'advance',
  label: 'advance stage',
  icon: TrendingUpIcon,
  color: 'primary',
};

const DETAILS_ACTION: RowActionSpec = {
  key: 'details',
  label: 'view details',
  icon: InfoOutlinedIcon,
};

/** "★★★★☆" reads faster in a grid than a number; unrated stays blank. */
export function ratingStars(rating: number): string {
  if (rating <= 0) {
    return '—';
  }
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/** Column model for the hiring pipeline. Name, email and job title are the searched ones. */
export const APPLICANT_COLUMNS: ColDef<PagedApplicantRow>[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  textColumn('jobTitle', 'Job'),
  statusColumn('stage', 'Stage'),
  valueColumn('rating', 'Rating', (row) => ratingStars(row.rating)),
  dateColumn('createdAt', 'Applied'),
  statusColumn('source', 'Source'),
  actionsColumn([ADVANCE_ACTION, DETAILS_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
