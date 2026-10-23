import { useState } from 'react';
import { Flex } from '@exyconn/shell/components/ui';
import { CrmMailSort } from '@exyconn/shell/graphql/generated';
import { FilterIconButton, FiltersDrawer, SortSelect } from '../../mail-filters';
import { MailFiltersForm, mailFilterCount, type MailFilters } from './forms/mail-filters';
import { MailSearchBar } from './MailSearchBar';

const SORT_OPTIONS = [
  { value: CrmMailSort.Newest, label: 'Newest first' },
  { value: CrmMailSort.Oldest, label: 'Oldest first' },
  { value: CrmMailSort.Sender, label: 'Sender A–Z' },
  { value: CrmMailSort.Subject, label: 'Subject A–Z' },
] as const;

interface MailListHeaderProps {
  search: string;
  sort: CrmMailSort;
  filters: MailFilters;
  onSearch: (search: string) => void;
  onSort: (sort: CrmMailSort) => void;
  onFilters: (filters: MailFilters) => void;
}

/** Above the list: search, the order, and the filter icon that opens the filters panel. */
export function MailListHeader({
  search,
  sort,
  filters,
  onSearch,
  onSort,
  onFilters,
}: Readonly<MailListHeaderProps>) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Flex sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <MailSearchBar value={search} onSearch={onSearch} />
      </Flex>
      <SortSelect value={sort} options={SORT_OPTIONS} onChange={onSort} />
      <FilterIconButton count={mailFilterCount(filters)} onClick={() => setOpen(true)} />
      <FiltersDrawer open={open} title="Filter mail" onClose={close}>
        <MailFiltersForm
          filters={filters}
          onApply={(next) => {
            onFilters(next);
            close();
          }}
          onCancel={close}
        />
      </FiltersDrawer>
    </Flex>
  );
}
