import type { ColDef } from 'ag-grid-community';
import { statusColumn, textColumn, valueColumn } from '@exyconn/crud';
import type { MaTranscriptSearchQuery } from '@exyconn/shell/graphql/generated';
import { dateTimeColumn } from '../lib/columns';
import { formatOffset } from '../lib/format';

export type TranscriptHit = MaTranscriptSearchQuery['maTranscriptSearch']['rows'][number];

/** Transcript search results: the line, its meeting, how far in it was said and by whom. */
export const TRANSCRIPT_HIT_COLUMNS: ColDef<TranscriptHit>[] = [
  { ...textColumn<TranscriptHit>('text', 'What was said'), flex: 2, minWidth: 280 },
  { ...textColumn<TranscriptHit>('meetingTitle', 'Meeting'), sortable: false },
  dateTimeColumn<TranscriptHit>('meetingStartedAt', 'Meeting date'),
  valueColumn<TranscriptHit>('startMs', 'At', (row) => formatOffset(row.startMs)),
  textColumn<TranscriptHit>(
    'speakerLabel',
    'Speaker',
    (row, t) => row.speakerLabel ?? t('Unknown speaker'),
  ),
  statusColumn<TranscriptHit>('source', 'Source'),
];
