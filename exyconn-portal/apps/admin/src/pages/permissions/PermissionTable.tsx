import { useT } from '@exyconn/i18n';
import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@exyconn/shell/components/ui';
import { ACTIONS } from './permissions.logic';
import type { PermissionDraft } from './usePermissionDraft';
import { PermissionTableRow } from './PermissionTableRow';
import { actionLabel } from './actionLabel';

interface PermissionTableProps {
  role: string;
  modules: readonly string[];
  draft: PermissionDraft;
  isRestricted: (module: string) => boolean;
  busy: boolean;
  onReset: (module: string) => void;
}

/**
 * The matrix: modules down the side, actions across the top. A column's box ticks or clears
 * that action in every module — the bulk edit a column of switches never offered.
 */
export function PermissionTable({
  role,
  modules,
  draft,
  isRestricted,
  busy,
  onReset,
}: Readonly<PermissionTableProps>) {
  const t = useT();
  // Focusable: the container scrolls, and a scrollable region must be reachable by keyboard.
  return (
    <TableContainer sx={{ maxHeight: '65vh' }} tabIndex={0}>
      {/* Sized to its content rather than the panel: a row stays one easy sweep of the eye. */}
      <Table
        stickyHeader
        size="small"
        aria-label={t('What {role} may do in each module', { role })}
        sx={{ width: 'auto', minWidth: { md: 720 } }}
      >
        <TableHead>
          <TableRow>
            <TableCell component="th" scope="col" sx={{ minWidth: 240 }}>
              {t('Module')}
            </TableCell>
            <TableCell component="th" scope="col" align="center">
              {t('All')}
            </TableCell>
            {ACTIONS.map((action) => {
              const state = draft.columnState(action);
              return (
                <TableCell key={action} component="th" scope="col" align="center" sx={{ px: 0.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {t(actionLabel(action))}
                    <Checkbox
                      size="small"
                      checked={state === 'all'}
                      indeterminate={state === 'some'}
                      disabled={busy || modules.length === 0}
                      onChange={() => draft.toggleColumn(action)}
                      slotProps={{
                        input: {
                          'aria-label': t('{action} in every module', {
                            action: t(actionLabel(action)),
                          }),
                        },
                      }}
                    />
                  </Box>
                </TableCell>
              );
            })}
            <TableCell component="th" scope="col" align="center">
              {t('Reset')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {modules.map((module) => (
            <PermissionTableRow
              key={module}
              module={module}
              draft={draft}
              restricted={isRestricted(module)}
              busy={busy}
              onReset={onReset}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
