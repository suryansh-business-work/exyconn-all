import { useLocation, useNavigate } from 'react-router-dom';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Stack, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';

export const DEALS_BOARD_PATH = '/crm/deals';
export const DEALS_LIST_PATH = '/crm/deals/list';

/** The same deals as a board or as a register — one switch, shown on both. */
export function DealsViewToggle() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const view = pathname === DEALS_LIST_PATH ? 'list' : 'board';

  return (
    <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={view}
        aria-label="deals view"
        onChange={(_event, next: 'board' | 'list' | null) => {
          if (next === 'board') navigate(DEALS_BOARD_PATH);
          if (next === 'list') navigate(DEALS_LIST_PATH);
        }}
      >
        <ToggleButton value="board" aria-label="board view">
          <ViewKanbanIcon fontSize="small" sx={{ mr: 0.5 }} /> Board
        </ToggleButton>
        <ToggleButton value="list" aria-label="list view">
          <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} /> List
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
