import { useState } from 'react';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { MaEventsPagedDocument, type MaEventsPagedQuery } from '@exyconn/shell/graphql/generated';
import { toMaScope, type MeetingScope } from '../lib/scope';
import { useScopedFetcher } from '../lib/useScopedFetcher';
import { EventDetailsDialog } from './EventDetailsDialog';
import {
  EVENT_COLUMNS,
  MEETING_EVENT_COLUMNS,
  type EventGridContext,
  type MeetingEvent,
} from './events-grid';

interface MeetingEventsProps {
  scope: MeetingScope;
  /** Links a meeting's name to its page. */
  meetingHref: (meetingId: string) => string;
  /** One meeting's log; every meeting's when left out. */
  meetingId?: string;
}

/** The Meeting Assistant log, newest first, server-paged; a row opens its details. */
export function MeetingEvents({ scope, meetingHref, meetingId }: Readonly<MeetingEventsProps>) {
  const { formatDateTime } = useSettings();
  const [open, setOpen] = useState<MeetingEvent | null>(null);
  const fetchRows = useScopedFetcher(
    MaEventsPagedDocument,
    (data: MaEventsPagedQuery) => data.maEventsPaged,
    { scope: toMaScope(scope), meetingId },
  );
  const context: EventGridContext = { actions: {}, formatDateTime, meetingHref };
  return (
    <>
      <ServerDataGrid<MeetingEvent>
        columnDefs={meetingId ? MEETING_EVENT_COLUMNS : EVENT_COLUMNS}
        fetchRows={fetchRows}
        context={context}
        onRowClick={setOpen}
        searchPlaceholder="Search messages, meetings, people or types…"
      />
      <EventDetailsDialog event={open} onClose={() => setOpen(null)} />
    </>
  );
}
