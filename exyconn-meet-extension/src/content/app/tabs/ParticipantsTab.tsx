import { Chip, List, ListItem, ListItemText } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { PanelState } from '../PanelState';
import { usePanelQuery } from '../usePanelQuery';
import type { TabProps } from './types';

const POLL_MS = 30_000;

/** Who the portal has on record for this call (from the names visible in Meet). */
export function ParticipantsTab({ state, tab, prefs, logger }: Readonly<TabProps>) {
  const t = useT();
  const tracked = prefs.participantTracking && state.auth.org?.participantTracking === true;
  const query = usePanelQuery(
    { op: 'participants' },
    tracked && tab.meetingId !== null,
    POLL_MS,
    logger,
  );
  const people = query.data ?? [];
  const emptyText = tracked
    ? "No participants yet. Open Meet's People panel so the assistant can see everyone."
    : 'Participant tracking is turned off in your settings or by your company.';
  return (
    <PanelState
      loading={query.loading}
      error={query.error}
      empty={people.length === 0}
      emptyText={emptyText}
      onRetry={query.reload}
    >
      <List dense aria-label={t('Participants')}>
        {people.map((person) => (
          <ListItem
            key={person.id}
            disableGutters
            secondaryAction={
              <Chip
                size="small"
                label={person.status === 'JOINED' ? t('In the call') : t('Left')}
              />
            }
          >
            <ListItemText
              primary={person.displayName}
              secondary={
                person.rejoinCount > 0
                  ? t('Rejoined {count} times', { count: person.rejoinCount })
                  : null
              }
            />
          </ListItem>
        ))}
      </List>
    </PanelState>
  );
}
