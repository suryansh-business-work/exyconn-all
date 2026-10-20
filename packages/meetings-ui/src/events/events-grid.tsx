import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Link as RouterLink } from 'react-router-dom';
import { statusColumn, textColumn } from '@exyconn/crud';
import { Link } from '@exyconn/shell/components/ui';
import type { MaEventsPagedQuery } from '@exyconn/shell/graphql/generated';
import { dateTimeColumn, type TimedGridContext } from '../lib/columns';

export type MeetingEvent = MaEventsPagedQuery['maEventsPaged']['rows'][number];

/** The log grid's context: the time formatter, and where a meeting's page is. */
export interface EventGridContext extends TimedGridContext<MeetingEvent> {
  meetingHref: (meetingId: string) => string;
}

/** The meeting an event belongs to, linked; account-level events have none. */
function MeetingCell({ data, context }: Readonly<ICellRendererParams<MeetingEvent>>) {
  if (!data?.meetingId) {
    return <>{data?.meetingTitle || '—'}</>;
  }
  return (
    <Link component={RouterLink} to={(context as EventGridContext).meetingHref(data.meetingId)}>
      {data.meetingTitle}
    </Link>
  );
}

const meetingColumn: ColDef<MeetingEvent> = {
  field: 'meetingTitle',
  headerName: 'Meeting',
  cellRenderer: MeetingCell,
  minWidth: 180,
};

const leading: ColDef<MeetingEvent>[] = [
  dateTimeColumn<MeetingEvent>('createdAt', 'Time'),
  statusColumn<MeetingEvent>('level', 'Level'),
];

const trailing: ColDef<MeetingEvent>[] = [
  textColumn<MeetingEvent>('actorName', 'Actor'),
  textColumn<MeetingEvent>('type', 'Type'),
  { ...textColumn<MeetingEvent>('message', 'Message'), flex: 1, minWidth: 260 },
];

/** Every meeting's log: each row names and links its meeting. */
export const EVENT_COLUMNS: ColDef<MeetingEvent>[] = [...leading, meetingColumn, ...trailing];

/** One meeting's log: the meeting is the page, so the column is left out. */
export const MEETING_EVENT_COLUMNS: ColDef<MeetingEvent>[] = [...leading, ...trailing];
