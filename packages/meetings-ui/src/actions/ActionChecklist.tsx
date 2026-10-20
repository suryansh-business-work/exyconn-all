import { useT, useFormatters } from '@exyconn/i18n';
import { Box, Button, Flex } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  MaActionItemsPagedDocument,
  type MaActionItemsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ActionBulkForm } from '../forms/action-bulk';
import { ActionItemForm, type ActionItemRow } from '../forms/action-item';
import type { TimedGridContext } from '../lib/columns';
import { toMaScope, type MeetingScope } from '../lib/scope';
import { useScopedFetcher } from '../lib/useScopedFetcher';
import { ACTION_COLUMNS, MEETING_ACTION_COLUMNS } from './action-grid';
import { actionStats } from './action-stats';
import { ActionDetailDrawer } from './ActionDetailDrawer';
import { ActionSelectionContext } from './selection';
import { useActionChecklist } from './useActionChecklist';

interface ActionChecklistProps {
  scope: MeetingScope;
  /** One meeting's checklist; every meeting's when left out. */
  meetingId?: string;
}

/**
 * The action checklist: completion tiles, a server-paged grid (search, filters and sorting
 * by the server), complete/reopen in place, bulk status/priority, add/edit/delete, and a
 * drawer with the evidence, comments and history of one item.
 */
export function ActionChecklist({ scope, meetingId }: Readonly<ActionChecklistProps>) {
  const t = useT();
  const formatters = useFormatters();
  const { formatDateTime } = useSettings();
  const list = useActionChecklist(scope, meetingId);
  const { crud, selection } = list;
  const fetchRows = useScopedFetcher(
    MaActionItemsPagedDocument,
    (data: MaActionItemsPagedQuery) => data.maActionItemsPaged,
    { scope: toMaScope(scope), meetingId },
  );
  const context: TimedGridContext<ActionItemRow> = {
    actions: {
      toggleDone: list.toggleDone,
      details: list.setViewing,
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDateTime,
  };
  const formMeetingId = crud.editing?.meetingId ?? meetingId;
  const selectedIds = [...selection.selected];

  return (
    <ActionSelectionContext.Provider value={selection}>
      <StatRow stats={actionStats(list.stats, formatters)} loading={list.statsLoading} />
      <Box sx={[densePanel, { mt: 2 }]}>
        {meetingId && (
          <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={crud.openCreate}>
              {t('Add action item')}
            </Button>
          </Flex>
        )}
        {selectedIds.length > 0 && (
          <ActionBulkForm
            ids={selectedIds}
            onDone={list.afterBulk}
            onCancel={list.clearSelection}
          />
        )}
        <ServerDataGrid<ActionItemRow>
          columnDefs={meetingId ? MEETING_ACTION_COLUMNS : ACTION_COLUMNS}
          fetchRows={fetchRows}
          context={context}
          refreshSignal={crud.refreshSignal}
          onRowClick={list.setViewing}
          searchPlaceholder="Search actions, owners or meetings…"
        />
      </Box>
      <CrudDialog
        open={crud.open}
        title={t(crud.editing ? 'Edit action item' : 'New action item')}
        onClose={crud.close}
      >
        {formMeetingId && (
          <ActionItemForm
            initial={crud.editing}
            meetingId={formMeetingId}
            onDone={crud.onDone}
            onCancel={crud.close}
          />
        )}
      </CrudDialog>
      <ActionDetailDrawer
        row={list.viewing}
        onClose={() => list.setViewing(null)}
        onChanged={list.setViewing}
      />
    </ActionSelectionContext.Provider>
  );
}
