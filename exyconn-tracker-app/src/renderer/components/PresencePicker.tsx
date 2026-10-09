import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Alert, MenuItem, Stack, TextField, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import type { PresenceState, PresenceStatus } from '@shared/types';
import {
  formatElapsed,
  formatTimeOfDay,
  isAwayPresence,
  PRESENCE_OPTIONS,
} from '@exyconn/tracker-core';
import { useT, type Interpolations } from '@exyconn/i18n';
import { run } from '../run';
import usePendingAction from '../hooks/usePendingAction';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import SelectSpinner from './SelectSpinner';

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
  const { pending, error, perform } = usePendingAction<'presence'>();
  const saving = pending !== null;
  useAnnounce(error, 'assertive');

  // The portal is the source of truth: a note set from another device, or rejected here,
  // must not leave this field showing something nobody recorded.
  useEffect(() => setNote(presence.note), [presence.note]);

  const save = async (status: PresenceStatus, withNote: string): Promise<void> => {
    const saved = await perform(
      'presence',
      () => globalThis.tracker.setPresence(status, withNote),
      t('Could not update your status.'),
    );
    if (!saved) {
      // Nothing was recorded, so the field goes back to what the portal holds.
      setNote(presence.note);
    }
  };
  const apply = (status: PresenceStatus, withNote: string): void => {
    run(() => save(status, withNote));
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
        disabled={saving}
        helperText={saving ? t('Saving…') : undefined}
        onChange={(event) => apply(event.target.value as PresenceStatus, note)}
        slotProps={{ select: { IconComponent: saving ? SelectSpinner : undefined } }}
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
        disabled={saving}
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

      {error !== null && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {error}
        </Alert>
      )}

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
