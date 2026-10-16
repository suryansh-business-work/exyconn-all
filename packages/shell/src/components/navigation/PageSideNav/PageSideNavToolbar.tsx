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
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/** The sort options, as English sources. */
const SORT_OPTIONS: ReadonlyArray<{ value: PageSideNavSort; label: string }> = [
  { value: 'category', label: 'By category' },
  { value: 'asc', label: 'Name A–Z' },
  { value: 'desc', label: 'Name Z–A' },
];

/** Search, sort and expand/collapse-all above the side menu. */
export function PageSideNavToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  canFold,
  onExpandAll,
  onCollapseAll,
}: Readonly<PageSideNavToolbarProps>) {
  const t = useT();
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
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="text"
          startIcon={<UnfoldMoreIcon />}
          disabled={!canFold}
          onClick={onExpandAll}
        >
          {t('Expand all')}
        </Button>
        <Button
          size="small"
          variant="text"
          startIcon={<UnfoldLessIcon />}
          disabled={!canFold}
          onClick={onCollapseAll}
        >
          {t('Collapse all')}
        </Button>
      </Stack>
    </Stack>
  );
}
