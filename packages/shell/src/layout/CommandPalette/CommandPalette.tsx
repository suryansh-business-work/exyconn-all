import { useEffect, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Dialog,
  InputAdornment,
  LinearProgress,
  List,
  TextField,
  Text,
} from '@/components/ui';
import { useSearchQuery } from '@/graphql/generated';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import { useAuth } from '@/auth/AuthContext';
import { PaletteResults } from './PaletteResults';
import { moduleItems, recordItems, type PaletteItem } from './palette.items';

/** How long to wait after a keystroke before asking the server. */
const DEBOUNCE_MS = 200;
/** Below this the server refuses anyway, so do not ask. */
const MIN_QUERY = 2;

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Jump to anything: a module, an invoice, a ticket, a colleague, a risk.
 *
 * The portal had a topbar box that searched the list of modules — it could take you to
 * Finance but never to an invoice. This asks every module the caller's roles can open, and
 * the modules themselves are still matched locally so the first keystroke shows something
 * without waiting for a round trip.
 */
export function CommandPalette({ open, onClose }: Readonly<CommandPaletteProps>) {
  const t = useT();
  const { user } = useAuth();
  const navigateTo = useCrossAppNavigate();
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  // Debounced: somebody typing "invoice" should cost one search, not seven.
  useEffect(() => {
    const timer = globalThis.setTimeout(() => setQuery(typed), DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [typed]);

  // A fresh box every time it opens: the last thing somebody looked for is rarely the next.
  useEffect(() => {
    if (open) {
      setTyped('');
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const { data, loading } = useSearchQuery({
    variables: { query },
    skip: !open || query.trim().length < MIN_QUERY,
    fetchPolicy: 'no-cache',
  });

  const items = useMemo(
    () => [...moduleItems(user?.roles ?? [], typed), ...recordItems(data)],
    [user?.roles, typed, data],
  );

  useEffect(() => setCursor(0), [items.length]);

  const go = (item: PaletteItem) => {
    onClose();
    navigateTo(item.app, item.path);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (items.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((at) => (at + 1) % items.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((at) => (at - 1 + items.length) % items.length);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      go(items[cursor]);
    }
  };

  const nothingFound = typed.trim().length >= MIN_QUERY && !loading && items.length === 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-label={t('Search')}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <TextField
          fullWidth
          autoFocus
          size="small"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('Search people, tickets, invoices, projects…')}
          slotProps={{
            // The palette has no room for a visible label above the one field it contains,
            // so the field carries its own name for anybody not looking at the dialog.
            htmlInput: { 'aria-label': t('Search the portal') },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      {loading && <LinearProgress />}
      <List dense sx={{ maxHeight: 420, overflowY: 'auto', pt: 0 }}>
        <PaletteResults items={items} cursor={cursor} onPick={go} onHover={setCursor} />
      </List>
      {nothingFound && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Text size="sm" color="text.secondary">
            {t('Nothing matched. Try a name, a reference or a number.')}
          </Text>
        </Box>
      )}
    </Dialog>
  );
}
