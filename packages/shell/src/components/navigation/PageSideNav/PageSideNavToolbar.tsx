import type { KeyboardEvent } from 'react';
import { useT } from '@exyconn/i18n';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { Button, InputAdornment, MenuItem, Stack, TextField } from '@/components/ui';
import type { PageSideNavSort } from './pageSideNav.types';

interface PageSideNavToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  sort: PageSideNavSort;
  onSortChange: (sort: PageSideNavSort) => void;
  /** Folding only means something on the grouped list, and not while a search holds groups open. */
  canFold: boolean;
  /** Every category is open, so the toggle offers to collapse them all. */
  allExpanded: boolean;
  /** Collapses every category when all are open, else opens them all. */
  onToggleAll: () => void;
}

/** The sort options, as English sources. */
const SORT_OPTIONS: ReadonlyArray<{ value: PageSideNavSort; label: string }> = [
  { value: 'category', label: 'By category' },
  { value: 'asc', label: 'Name A–Z' },
  { value: 'desc', label: 'Name Z–A' },
];

/** Search, sort and one expand/collapse-all toggle above the side menu. */
export function PageSideNavToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  canFold,
  allExpanded,
  onToggleAll,
}: Readonly<PageSideNavToolbarProps>) {
  const t = useT();
  const foldIcon = allExpanded ? <UnfoldLessIcon aria-hidden /> : <UnfoldMoreIcon aria-hidden />;
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onQueryChange('');
    }
  };

  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      <TextField
        type="search"
        size="small"
        fullWidth
        label={t('Search')}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={onSearchKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" aria-hidden />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        size="small"
        fullWidth
        label={t('Sort')}
        value={sort}
        onChange={(event) => onSortChange(event.target.value as PageSideNavSort)}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
      <Button
        size="small"
        variant="outlined"
        fullWidth
        startIcon={foldIcon}
        aria-expanded={allExpanded}
        disabled={!canFold}
        onClick={onToggleAll}
      >
        {allExpanded ? t('Collapse all') : t('Expand all')}
      </Button>
    </Stack>
  );
}
