import {
  TrackerManualEntryStatus,
  type MyTrackerManualEntriesQuery,
} from '@exyconn/shell/graphql/generated';

type Entry = MyTrackerManualEntriesQuery['myTrackerManualEntries'][number];

const base: Entry = {
  id: '',
  userId: 'u1',
  userName: 'Asha Rao',
  projectId: 'p1',
  projectName: 'Billing',
  startedAt: '2026-03-05T10:00:00.000Z',
  endedAt: '2026-03-05T11:30:00.000Z',
  durationMs: 90 * 60_000,
  note: 'Client call',
  status: TrackerManualEntryStatus.Pending,
  reviewedAt: null,
  reviewNote: '',
  createdAt: '2026-03-05T12:00:00.000Z',
};

/** One claim still awaiting review, and one a reviewer has turned down. */
export const entries: Entry[] = [
  { ...base, id: 'm1' },
  {
    ...base,
    id: 'm2',
    projectId: '',
    projectName: '',
    startedAt: '2026-03-06T15:00:00.000Z',
    durationMs: 45 * 60_000,
    note: 'Site visit',
    status: TrackerManualEntryStatus.Rejected,
    reviewedAt: '2026-03-07T09:00:00.000Z',
    reviewNote: 'Outside working hours',
  },
];
