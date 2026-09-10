import type { ReactElement } from 'react';
import { Button, Chip, Divider, Flex, Stack, Typography } from '@exyconn/ui';
import type { ManualEntry, ManualEntryStatus } from '@shared/types';
import { formatHoursMinutes } from '../format';
import { formatDateTime } from '../time';
import Surface from './Surface';

/** The colour a decision is worth. Pending is deliberately neutral: it is not a promise. */
const STATUS_COLOR: Record<ManualEntryStatus, 'default' | 'success' | 'error'> = {
  PENDING: 'default',
  APPROVED: 'success',
  REJECTED: 'error',
};

const STATUS_LABEL: Record<ManualEntryStatus, string> = {
  PENDING: 'Waiting on a decision',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

interface RowProps {
  entry: ManualEntry;
  timezone: string;
  onWithdraw: (entry: ManualEntry) => void;
}

/** What the time was booked against, in the words the picker used. */
function bookedTo(entry: ManualEntry): string {
  if (entry.taskKey === '') {
    return entry.projectName;
  }
  return `${entry.projectName} · ${entry.taskKey} ${entry.taskTitle}`;
}

function EntryRow({ entry, timezone, onWithdraw }: Readonly<RowProps>): ReactElement {
  return (
    <Stack spacing={0.75}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="subtitle2">{formatHoursMinutes(entry.durationMs)}</Typography>
        <Chip size="small" color={STATUS_COLOR[entry.status]} label={STATUS_LABEL[entry.status]} />
      </Flex>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>
        {formatDateTime(entry.startedAt, timezone)} — {formatDateTime(entry.endedAt, timezone)}
      </Typography>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>
        {bookedTo(entry)}
      </Typography>
      <Typography variant="body2">{entry.note}</Typography>
      {entry.reviewNote !== '' && (
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          Reviewer: {entry.reviewNote}
        </Typography>
      )}
      {entry.status === 'PENDING' && (
        <Flex direction="row" justifyContent="flex-end">
          <Button size="small" color="inherit" onClick={() => onWithdraw(entry)}>
            Withdraw
          </Button>
        </Flex>
      )}
    </Stack>
  );
}

interface Props {
  entries: ManualEntry[];
  timezone: string;
  onWithdraw: (entry: ManualEntry) => void;
}

/** The employee's own claims, newest first, each showing where it stands. */
export default function ManualEntryList({
  entries,
  timezone,
  onWithdraw,
}: Readonly<Props>): ReactElement {
  if (entries.length === 0) {
    return (
      <Surface>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          You have not claimed any off-computer time in the last 90 days.
        </Typography>
      </Surface>
    );
  }

  return (
    <Surface>
      <Stack divider={<Divider flexItem />} spacing={1.5}>
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} timezone={timezone} onWithdraw={onWithdraw} />
        ))}
      </Stack>
    </Surface>
  );
}
