import type { ColDef } from 'ag-grid-community';
import { statusColumn, textColumn, valueColumn, derivedColumn } from '@exyconn/crud';
import { dateTimeColumn } from '../lib/columns';
import { confidencePercent, formatSeconds } from '../lib/format';
import { MaParticipantSource } from '@exyconn/shell/graphql/generated';
import type { ParticipantRow } from './participant-attendance';

/** Everyone seen in a call across the meetings in scope. Name and email hit the server search. */
export const PARTICIPANT_COLUMNS: ColDef<ParticipantRow>[] = [
  textColumn<ParticipantRow>('displayName', 'Name'),
  textColumn<ParticipantRow>('email', 'Verified email', (row, t) => row.email ?? t('Not verified')),
  { ...textColumn<ParticipantRow>('meetingTitle', 'Meeting'), sortable: false },
  dateTimeColumn<ParticipantRow>('meetingStartedAt', 'Meeting date'),
  valueColumn<ParticipantRow>('totalSeconds', 'Time in call', (row) =>
    formatSeconds(row.totalSeconds),
  ),
  valueColumn<ParticipantRow>('rejoinCount', 'Rejoins', (row) => String(row.rejoinCount)),
  statusColumn<ParticipantRow>('status', 'Status'),
  statusColumn<ParticipantRow>('source', 'Source'),
  derivedColumn<ParticipantRow>('confidence', 'Confidence', (row, t) =>
    row.source === MaParticipantSource.MeetUi
      ? t('Best effort · {percent}%', { percent: confidencePercent(row.confidence) })
      : t('Verified'),
  ),
];
