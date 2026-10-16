import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import {
  Flex,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from '@exyconn/shell/components/ui';
import { MODULE_SORTS, isModuleSort, type ModuleSort } from './moduleQuery';

interface ModuleToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: ModuleSort;
  onSortChange: (value: ModuleSort) => void;
}

/** Search and sort above the launcher's cards. */
export function ModuleToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: Readonly<ModuleToolbarProps>) {
  const t = useT();
  const clear = search ? (
    <InputAdornment position="end">
      <IconButton size="small" aria-label={t('Clear search')} onClick={() => onSearchChange('')}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </InputAdornment>
  ) : undefined;
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <TextField
        size="small"
        type="search"
        label={t('Search modules')}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onSearchChange('');
          }
        }}
        sx={{ width: { xs: '100%', sm: 320 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: clear,
          },
        }}
      />
      <TextField
        select
        size="small"
        label={t('Sort by')}
        value={sort}
        onChange={(event) => {
          if (isModuleSort(event.target.value)) {
            onSortChange(event.target.value);
          }
        }}
        sx={{ width: { xs: '100%', sm: 200 } }}
      >
        {MODULE_SORTS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
    </Flex>
  );
}
