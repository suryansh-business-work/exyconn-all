import { useState } from 'react';
import { Tab, Tabs } from '@exyconn/shell/components/ui';
import { useT } from '@exyconn/i18n';
import { TicketComments } from './TicketComments';
import { TicketActivity } from './TicketActivity';

/** The two ways to read what has happened to a ticket. */
type TicketTrailView = 'comments' | 'history';

/** A ticket's conversation and its history, one at a time — on the dialog and on the page. */
export function TicketTrail({ taskId }: Readonly<{ taskId: string }>) {
  const t = useT();
  const [trail, setTrail] = useState<TicketTrailView>('comments');
  return (
    <>
      <Tabs
        value={trail}
        onChange={(_event, next: TicketTrailView) => setTrail(next)}
        aria-label={t('Ticket conversation and history')}
        sx={{ mb: 2 }}
      >
        <Tab value="comments" label={t('Comments')} />
        <Tab value="history" label={t('History')} />
      </Tabs>

      {trail === 'comments' ? (
        <TicketComments taskId={taskId} />
      ) : (
        <TicketActivity taskId={taskId} />
      )}
    </>
  );
}
