import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import { IconButton, Tooltip } from '@/components/ui';

/** The palette's shortcut as this platform writes it: ⌘K on a Mac, Ctrl K elsewhere. */
export const searchShortcut = () =>
  globalThis.navigator?.platform?.startsWith('Mac') ? '⌘K' : 'Ctrl K';

interface TopbarSearchProps {
  onOpen: () => void;
}

/**
 * The topbar's way into the command palette: one round icon among the topbar's buttons,
 * opening the full search box over the page. An icon rather than a wide field, so the
 * topbar fits a phone as well as a desk; the tooltip carries the keyboard shortcut.
 */
export function TopbarSearch({ onOpen }: Readonly<TopbarSearchProps>) {
  const t = useT();
  const shortcut = searchShortcut();
  return (
    <Tooltip title={t('Search ({shortcut})', { shortcut })}>
      <IconButton onClick={onOpen} aria-label={t('Search')} aria-keyshortcuts="Control+K Meta+K">
        <SearchIcon />
      </IconButton>
    </Tooltip>
  );
}
