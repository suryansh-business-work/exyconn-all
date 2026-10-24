import RefreshIcon from '@mui/icons-material/Refresh';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';
import { CrmEmailThreadSort } from '@exyconn/shell/graphql/generated';
import { FilterIconButton, SortSelect } from '../../../mail-filters';
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
        <SortSelect value={sort} options={SORT_OPTIONS} onChange={onSort} />
        <FilterIconButton count={filterCount} onClick={onOpenFilters} />
      </Flex>
    </Flex>
  );
}
