import { Fragment } from 'react';
import { Separator } from 'tamagui';
import type { ManualEntry } from '@exyconn/tracker-core';
import { Surface } from '../ui/Surface';
import { Body } from '../ui/Typography';
import { ManualEntryRow } from './ManualEntryRow';

interface Props {
  entries: readonly ManualEntry[];
  timezone: string;
  onWithdraw: (entry: ManualEntry) => void;
}

/** The employee's own claims, newest first, each showing where it stands. */
export function ManualEntryList({ entries, timezone, onWithdraw }: Readonly<Props>) {
  if (entries.length === 0) {
    return (
      <Surface>
        <Body color="$muted">You have not claimed any off-computer time in the last 90 days.</Body>
      </Surface>
    );
  }

  return (
    <Surface gap="$3">
      {entries.map((entry, position) => (
        <Fragment key={entry.id}>
          {position === 0 ? null : <Separator borderColor="$hairline" />}
          <ManualEntryRow entry={entry} timezone={timezone} onWithdraw={onWithdraw} />
        </Fragment>
      ))}
    </Surface>
  );
}
