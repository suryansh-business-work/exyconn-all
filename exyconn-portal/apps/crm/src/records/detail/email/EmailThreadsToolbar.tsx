import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useT } from '@exyconn/i18n';
import {
  Badge,
  Button,
  Flex,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { CrmEmailThreadSort } from '@exyconn/shell/graphql/generated';
import { MailSearchBar } from '../../../pages/mail/MailSearchBar';

const SORT_OPTIONS = [
  { value: CrmEmailThreadSort.Newest, label: 'Newest first' },
  { value: CrmEmailThreadSort.Oldest, label: 'Oldest first' },
  { value: CrmEmailThreadSort.Subject, label: 'Subject A–Z' },
] as const;

interface EmailThreadsToolbarProps {
  search: string;
  sort: CrmEmailThreadSort;
  /** How many filters are set, shown on the filter icon. */
  filterCount: number;
  syncing: boolean;
  onSearch: (search: string) => void;
  onSort: (sort: CrmEmailThreadSort) => void;
  onOpenFilters: () => void;
  onNewEmail: () => void;
  onRefresh: () => void;
}

/** New email and Refresh, then search, sort and the filter icon that opens the side panel. */
export function EmailThreadsToolbar({
  search,
  sort,
  filterCount,
  syncing,
  onSearch,
  onSort,
  onOpenFilters,
  onNewEmail,
  onRefresh,
}: Readonly<EmailThreadsToolbarProps>) {
  const t = useT();
  const filterLabel = t('Filters ({count} active)', { count: filterCount });
  return (
    <Flex direction="column" spacing={1.5}>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={onNewEmail}>
          {t('New email')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          loading={syncing}
        >
          {t('Refresh')}
        </Button>
      </Flex>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Flex sx={{ flex: '1 1 240px', minWidth: 0 }}>
          <MailSearchBar value={search} onSearch={onSearch} />
        </Flex>
        <TextField
          select
          size="small"
          label={t('Sort')}
          value={sort}
          onChange={(event) => onSort(event.target.value as CrmEmailThreadSort)}
          sx={{ minWidth: 170 }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {t(option.label)}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title={filterLabel}>
          <IconButton onClick={onOpenFilters} aria-label={filterLabel} aria-haspopup="dialog">
            <Badge badgeContent={filterCount} color="primary">
              <FilterListIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Flex>
    </Flex>
  );
}
