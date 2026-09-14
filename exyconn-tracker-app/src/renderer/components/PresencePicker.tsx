import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { MenuItem, Stack, TextField, Typography } from '@exyconn/ui';
import type { PresenceState, PresenceStatus } from '@shared/types';
import {
  formatElapsed,
  formatTimeOfDay,
  isAwayPresence,
  PRESENCE_OPTIONS,
} from '@exyconn/tracker-core';
import { useT, type Interpolations } from '@exyconn/i18n';
import { run } from '../run';

type Translate = (source: string, values?: Interpolations) => string;

interface Props {
  presence: PresenceState;
  /** The zone the "since" time is read in — the employee's own, like everything else here. */
  timezone: string;
}

/** "On lunch since 12:30 PM (24m)" — what they said, and how long ago they said it. */
function sinceLabel(t: Translate, presence: PresenceState, timezone: string): string {
  if (presence.since === null) {
    return t('Tracking runs as normal.');
  }
  const at = new Date(presence.since);
  if (Number.isNaN(at.getTime())) {
    return '';
  }
  const elapsed = formatElapsed(Date.now() - at.getTime());
  return t('Since {time} · {elapsed}', {
    time: formatTimeOfDay(presence.since, timezone),
    elapsed,
  });
}

/**
 * What the employee is doing right now, in their own words.
 *
 * Choosing anything but Working pauses the session, because a tracker that kept counting
 * through lunch would put lunch on a timesheet somebody gets paid against — and the caption
 * says so before the choice is made, not after. Coming back to Working resumes it.
 *
 * The note is optional and applied when the field loses focus: it is a courtesy to whoever
 * is looking for them ("back at 2"), not something to be re-sent on every keystroke.
 */
export default function PresencePicker({ presence, timezone }: Readonly<Props>): ReactElement {
  const t = useT();
  const [note, setNote] = useState(presence.note);

  // The portal is the source of truth: a note set from another device, or rejected here,
  // must not leave this field showing something nobody recorded.
  useEffect(() => setNote(presence.note), [presence.note]);

  const apply = (status: PresenceStatus, withNote: string): void => {
    run(() => window.tracker.setPresence(status, withNote));
  };

  const since = sinceLabel(t, presence, timezone);
  const caption = isAwayPresence(presence.status)
    ? t('{since} — tracking stays paused until you are back on Working.', { since })
    : since;

  return (
    <Stack spacing={1.25}>
      <TextField
        select
        size="small"
        fullWidth
        label={t('My status')}
        value={presence.status}
        onChange={(event) => apply(event.target.value as PresenceStatus, note)}
      >
        {PRESENCE_OPTIONS.map((option) => (
          <MenuItem key={option.status} value={option.status}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        fullWidth
        label={t('Note (optional)')}
        placeholder={t('Back at 2')}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={() => {
          if (note !== presence.note) {
            apply(presence.status, note);
          }
        }}
        slotProps={{
          htmlInput: { maxLength: 120 },
        }}
      />

      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {caption}
      </Typography>
    </Stack>
  );
}
