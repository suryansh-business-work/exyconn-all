import { useEffect, useRef, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import { InputAdornment, TextField } from '@exyconn/shell/components/ui';
import { useDebouncedValue } from '@exyconn/shell/hooks/useDebouncedValue';

/** How long typing must pause before the search runs (it reaches Gmail). */
const SEARCH_DELAY_MS = 400;

interface MailSearchBarProps {
  /** The search in the address. */
  value: string;
  onSearch: (search: string) => void;
}

/** Searches subjects, previews and people in the list, and each mailbox in Gmail. */
export function MailSearchBar({ value, onSearch }: Readonly<MailSearchBarProps>) {
  const t = useT();
  const [typed, setTyped] = useState(value);
  const settled = useDebouncedValue(typed.trim(), SEARCH_DELAY_MS);

  const searched = useRef(settled);

  // Only a pause in typing searches: going Back to an older search must not be undone here.
  useEffect(() => {
    if (settled !== searched.current) {
      searched.current = settled;
      onSearch(settled);
    }
  }, [settled, onSearch]);

  return (
    <TextField
      type="search"
      size="small"
      fullWidth
      label={t('Search mail')}
      value={typed}
      onChange={(event) => setTyped(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
