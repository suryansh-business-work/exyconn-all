import { useT } from '@exyconn/i18n';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Checkbox,
  Chip,
  IconButton,
  TableCell,
  TableRow,
  Text,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { ACTIONS, rowStatus } from './permissions.logic';
import type { PermissionDraft } from './usePermissionDraft';
import { actionLabel } from './actionLabel';

const STATUS_COLOR = { Unsaved: 'info', Restricted: 'warning', Default: 'default' } as const;

interface PermissionTableRowProps {
  module: string;
  draft: PermissionDraft;
  restricted: boolean;
  busy: boolean;
  onReset: (module: string) => void;
}

/** One module: its status, an "every action" box, one box per action, and a reset. */
export function PermissionTableRow({
  module,
  draft,
  restricted,
  busy,
  onReset,
}: Readonly<PermissionTableRowProps>) {
  const t = useT();
  const status = rowStatus(restricted, draft.isDirty(module));
  const row = draft.rowState(module);
  const current = draft.current(module);
  return (
    <TableRow hover>
      <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
        <Text size="sm" weight="medium" component="span" sx={{ mr: 1 }}>
          {module}
        </Text>
        <Chip size="small" variant="outlined" color={STATUS_COLOR[status]} label={t(status)} />
      </TableCell>
      <TableCell padding="checkbox" align="center">
        <Checkbox
          size="small"
          checked={row === 'all'}
          indeterminate={row === 'some'}
          disabled={busy}
          onChange={() => draft.toggleRow(module)}
          slotProps={{ input: { 'aria-label': t('Every action in {module}', { module }) } }}
        />
      </TableCell>
      {ACTIONS.map((action) => (
        <TableCell key={action} padding="checkbox" align="center">
          <Checkbox
            size="small"
            checked={current.includes(action)}
            disabled={busy}
            onChange={() => draft.toggleCell(module, action)}
            slotProps={{
              input: {
                'aria-label': t('{action} in {module}', { action: t(actionLabel(action)), module }),
              },
            }}
          />
        </TableCell>
      ))}
      <TableCell padding="checkbox" align="center">
        {restricted && (
          <Tooltip title={t('Back to default (everything)')}>
            <IconButton
              size="small"
              disabled={busy}
              onClick={() => onReset(module)}
              aria-label={t('Reset {module} to default', { module })}
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
