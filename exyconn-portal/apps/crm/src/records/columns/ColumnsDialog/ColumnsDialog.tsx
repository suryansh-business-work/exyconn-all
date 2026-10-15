import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  TextField,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import type { ColumnChoice } from '../buildColumns';
import { choiceLabel } from './choiceLabel';
import { ColumnCheckList } from './ColumnCheckList';
import { ColumnOrderList } from './ColumnOrderList';

interface ColumnsDialogProps {
  open: boolean;
  choices: readonly ColumnChoice[];
  /** The ids shown now, in order. */
  visible: readonly string[];
  /** The page's own columns, which "Reset" goes back to. */
  defaults: readonly string[];
  onClose: () => void;
  /** The chosen ids in order — empty when they are just the page's defaults. */
  onApply: (columns: string[]) => void;
}

/** Moves one entry of a list by one place, returning a new list. */
function moved(ids: readonly string[], index: number, offset: -1 | 1): string[] {
  const next = [...ids];
  const target = index + offset;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/** Choose which columns a list shows (grouped Built-in / Custom, searchable) and their order. */
export function ColumnsDialog({
  open,
  choices,
  visible,
  defaults,
  onClose,
  onApply,
}: Readonly<ColumnsDialogProps>) {
  const t = useT();
  const theme = useTheme();
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [draft, setDraft] = useState<string[]>([...visible]);
  const [filter, setFilter] = useState('');
  const byId = useMemo(() => new Map(choices.map((choice) => [choice.id, choice])), [choices]);
  const selected = useMemo(() => new Set(draft), [draft]);

  const needle = filter.trim().toLowerCase();
  const matching = choices.filter((choice) =>
    choiceLabel(t, choice).toLowerCase().includes(needle),
  );
  const ordered = draft.flatMap((id) => byId.get(id) ?? []);

  const toggle = (id: string) => {
    if (!selected.has(id)) {
      setDraft([...draft, id]);
      return;
    }
    // A list needs at least one column to show anything.
    if (draft.length > 1) {
      setDraft(draft.filter((current) => current !== id));
    }
  };
  const apply = () => {
    // A view stores property keys only; the page's other default columns are not choosable.
    onApply(sameIds(draft, defaults) ? [] : draft.filter((id) => byId.has(id)));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={onPhone}>
      <DialogTitle>{t('Choose columns')}</DialogTitle>
      <DialogContent dividers>
        <Flex direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              size="small"
              fullWidth
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              label={t('Search columns')}
            />
            <ColumnCheckList
              heading="Built-in"
              choices={matching.filter((choice) => !choice.custom)}
              selected={selected}
              onToggle={toggle}
            />
            <ColumnCheckList
              heading="Custom"
              choices={matching.filter((choice) => choice.custom)}
              selected={selected}
              onToggle={toggle}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ColumnOrderList
              columns={ordered}
              onMove={(index, offset) => setDraft(moved(draft, index, offset))}
              onRemove={toggle}
            />
          </Box>
        </Flex>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDraft([...defaults])}>{t('Reset to defaults')}</Button>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button variant="contained" onClick={apply}>
          {t('Apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
