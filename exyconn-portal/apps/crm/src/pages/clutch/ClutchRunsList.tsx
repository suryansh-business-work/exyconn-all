import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePagedFetcher } from '@exyconn/crud';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ClutchRunsPagedDocument,
  useDeleteClutchRunMutation,
  type ClutchRunsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CLUTCH_RUN_COLUMNS, type ClutchRunRow, type ClutchRunsContext } from './clutch-runs-grid';
import { clutchRunPath } from './clutch.paths';

/** Every Clutch search; a row opens its results, and a search can be deleted. */
export function ClutchRunsList({ refreshSignal }: Readonly<{ refreshSignal: number }>) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const [removed, setRemoved] = useState(0);
  const [remove] = useDeleteClutchRunMutation();
  const fetchRows = usePagedFetcher(
    ClutchRunsPagedDocument,
    (data: ClutchRunsPagedQuery) => data.clutchRunsPaged,
  );

  const context = useMemo<ClutchRunsContext>(() => {
    const deleteRun = async (row: ClutchRunRow) => {
      const ok = await confirm({
        title: 'Delete search',
        message: 'Delete this Clutch search and its results?',
        confirmText: 'Delete',
        destructive: true,
      });
      if (!ok) {
        return;
      }
      try {
        await remove({ variables: { id: row.id } });
        setRemoved((count) => count + 1);
        notify('Search deleted');
      } catch (err) {
        notify(errorMessage(err, 'Could not delete the search'), 'error');
      }
    };
    return { formatDateTime, actions: { delete: deleteRun } };
  }, [confirm, formatDateTime, notify, remove]);

  return (
    <ServerDataGrid
      columnDefs={CLUTCH_RUN_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      refreshSignal={refreshSignal + removed}
      onRowClick={(row) => navigate(clutchRunPath(row.id))}
      searchPlaceholder="Search past searches…"
      height={420}
    />
  );
}
