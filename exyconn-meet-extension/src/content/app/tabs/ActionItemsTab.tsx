import { useState } from 'react';
import { Checkbox, List, ListItem, ListItemIcon, ListItemText, Pagination } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { askWorker } from '../../../services/messaging';
import { ACTIONS_PAGE_SIZE } from '../../../services/meet-api';
import type { MaActionStatus } from '../../../graphql/generated';
import { PanelState } from '../PanelState';
import { usePanelQuery } from '../usePanelQuery';
import type { TabProps } from './types';
import { errorText } from '../../../utils/errors';

const POLL_MS = 30_000;

/** This meeting's action items; ticking one marks it completed in the portal. */
export function ActionItemsTab({ tab, logger }: Readonly<TabProps>) {
  const t = useT();
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const query = usePanelQuery({ op: 'actions', page }, tab.meetingId !== null, POLL_MS, logger);
  const rows = query.data?.rows ?? [];
  const pages = Math.ceil((query.data?.totalCount ?? 0) / ACTIONS_PAGE_SIZE);

  const toggle = (id: string, done: boolean): void => {
    const status: MaActionStatus = done ? 'COMPLETED' : 'PENDING';
    setSaving(id);
    setSaveError(null);
    askWorker({ type: 'panel/request', request: { op: 'setActionStatus', id, status } })
      .then(query.reload)
      .catch((error: unknown) => {
        logger.warn('Could not update an action item', error);
        setSaveError(errorText(error, 'Could not update the action item'));
      })
      .finally(() => setSaving(null));
  };

  return (
    <PanelState
      loading={query.loading}
      error={saveError ?? query.error}
      empty={rows.length === 0}
      emptyText="No action items yet. They appear once the notes are written."
      onRetry={query.reload}
    >
      <List dense aria-label={t('Action items')}>
        {rows.map((item) => {
          const labelId = `action-${item.id}`;
          const owner = item.assignedTo ?? t('Unassigned');
          return (
            <ListItem key={item.id} disableGutters>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={item.status === 'COMPLETED'}
                  disabled={saving === item.id}
                  onChange={(_event, checked) => toggle(item.id, checked)}
                  slotProps={{ input: { 'aria-labelledby': labelId } }}
                />
              </ListItemIcon>
              <ListItemText
                id={labelId}
                primary={item.title}
                secondary={item.overdue ? `${owner} · ${t('Overdue')}` : owner}
              />
            </ListItem>
          );
        })}
      </List>
      {pages > 1 ? (
        <Pagination
          count={pages}
          page={page + 1}
          onChange={(_event, next) => setPage(next - 1)}
          size="small"
        />
      ) : null}
    </PanelState>
  );
}
