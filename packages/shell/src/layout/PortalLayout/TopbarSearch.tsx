import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import { Box, Button, fontSize } from '@/components/ui';

interface TopbarSearchProps {
  onOpen: () => void;
}

/**
 * The topbar's way into the command palette.
 *
 * A button rather than a field: what used to sit here was an autocomplete over the list of
 * modules, which could take somebody to Finance but never to an invoice. The palette does
 * both, so this only has to open it — and it shows the shortcut, because the point of a
 * palette is that people stop using the mouse for it.
 */
export function TopbarSearch({ onOpen }: Readonly<TopbarSearchProps>) {
  const t = useT();
  const shortcut = globalThis.navigator?.platform?.startsWith('Mac') ? '⌘K' : 'Ctrl K';
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onOpen}
      startIcon={<SearchIcon fontSize="small" />}
      sx={{
        width: { sm: 200, md: 280 },
        mr: 1,
        justifyContent: 'flex-start',
        color: 'text.secondary',
        textTransform: 'none',
      }}
    >
      <Box component="span" sx={{ flexGrow: 1, textAlign: 'left' }}>
        {t('Search…')}
      </Box>
      {/* The same ink as the label, not a dimmer one: a hint at `text.disabled` on the
          topbar's own ground does not reach 4.5:1, and axe fails the whole page for it. */}
      <Box component="span" sx={{ fontSize: fontSize.xs }}>
        {shortcut}
      </Box>
    </Button>
  );
}
