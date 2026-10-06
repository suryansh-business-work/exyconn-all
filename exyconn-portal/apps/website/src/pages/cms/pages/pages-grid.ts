import type { ColDef } from 'ag-grid-community';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import TuneIcon from '@mui/icons-material/Tune';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import {
  DELETE_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { CmsPagesQuery } from '@exyconn/shell/graphql/generated';

export type CmsPageRow = CmsPagesQuery['cmsPages']['rows'][number];
export type PagesGridContext = DatedCrudGridContext<CmsPageRow>;

const isLive = (row: CmsPageRow) => row.published !== null && row.published !== undefined;

const ACTIONS: RowActionSpec[] = [
  { key: 'build', label: 'edit in the builder', icon: DesignServicesIcon, color: 'primary' },
  { key: 'settings', label: 'page settings', icon: TuneIcon },
  { key: 'preview', label: 'preview', icon: VisibilityIcon },
  {
    key: 'publish',
    label: 'publish',
    icon: PublishIcon,
    color: 'success',
    hidden: (row: CmsPageRow) => row.status === 'PUBLISHED',
  },
  {
    key: 'unpublish',
    label: 'unpublish',
    icon: UnpublishedIcon,
    color: 'warning',
    hidden: (row: CmsPageRow) => !isLive(row),
  },
  { key: 'duplicate', label: 'duplicate', icon: ContentCopyIcon },
  { key: 'revisions', label: 'revisions', icon: HistoryIcon },
  DELETE_ACTION,
];

/** The pages of a site: path and title first, then where each stands. */
export const PAGES_COLUMNS: ColDef<CmsPageRow>[] = [
  derivedColumn('path', 'Path', (row) => row.path),
  derivedColumn('title', 'Title', (row) => row.title),
  derivedColumn('kind', 'Kind', (row, t) => (row.kind === 'TEMPLATE' ? t('Template') : t('Page'))),
  derivedStatusColumn('status', 'Status', (row) => row.status),
  derivedColumn('updatedByName', 'Updated by', (row) => row.updatedByName || '—'),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn(ACTIONS),
];
