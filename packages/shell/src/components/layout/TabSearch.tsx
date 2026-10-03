import type { KeyboardEvent } from 'react';
import { useT } from '@exyconn/i18n';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, InputAdornment, TextField, Tooltip } from '@/components/ui';

interface TabSearchProps {
  open: boolean;
  query: string;
  onOpen: () => void;
  /** Closes the box and clears what was typed. */
  onClose: () => void;
  onQueryChange: (query: string) => void;
  /** Enter: go to the first tab that still matches. */
  onSubmit: () => void;
  /** The id of the tab strip the search narrows, for `aria-controls`. */
  controls: string;
}

/**
 * The search at the end of a tab strip: an icon until it is wanted, then a box that narrows
 * the tabs to the ones whose name matches. Escape (or the cross) puts the strip back as it was.
 */
export function TabSearch({
  open,
  query,
  onOpen,
  onClose,
  onQueryChange,
  onSubmit,
  controls,
}: Readonly<TabSearchProps>) {
  const t = useT();

  if (!open) {
    return (
      <Tooltip title={t('Search tabs')}>
        <IconButton
          aria-label={t('Search tabs')}
          aria-expanded={false}
          aria-controls={controls}
          onClick={onOpen}
        >
          <SearchIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <TextField
      size="small"
      autoFocus
      value={query}
      placeholder={t('Search tabs')}
      onChange={(event) => onQueryChange(event.target.value)}
      onKeyDown={onKeyDown}
      sx={{ width: { xs: 160, sm: 220 }, flexShrink: 0 }}
      slotProps={{
        htmlInput: { 'aria-label': t('Search tabs'), 'aria-controls': controls },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" aria-label={t('Close tab search')} onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
