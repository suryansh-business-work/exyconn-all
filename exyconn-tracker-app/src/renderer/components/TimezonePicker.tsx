import type { ReactElement } from 'react';
import { useMemo, useState, type HTMLAttributes } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  Stack,
  TextField,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { formatTimeOfDay, offsetLabel, timezoneNames } from '@exyconn/tracker-core';
import { useAnnounce } from '../a11y/LiveAnnouncer';

interface Props {
  /** The zone in force: this employee's pick, else the admin default, else this device's. */
  timezone: string;
}

/** MUI hands `renderOption` a `key` inside its props; React needs it passed, not spread. */
type OptionProps = HTMLAttributes<HTMLLIElement> & { key: string };

const SAVE_FAILED = 'Your timezone could not be saved. Check your connection and try again.';

/**
 * The employee picks the zone the whole app renders in — every screenshot time, every report
 * day, every "last synced". An Autocomplete, not a Select: there are ~400 IANA zones, and a
 * 400-row dropdown is not something anyone can use.
 *
 * The list comes from the runtime (`Intl.supportedValuesOf`), never a hardcoded table, and the
 * choice is persisted to the portal, which is what makes it follow the employee to the web
 * portal and to their next device.
 */
export default function TimezonePicker({ timezone }: Readonly<Props>): ReactElement {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  useAnnounce(failed ? t(SAVE_FAILED) : null, 'assertive');

  const zones = useMemo(
    () => timezoneNames(timezone, Intl.supportedValuesOf('timeZone')),
    [timezone],
  );
  // Precomputed once per list: an Intl formatter per option per keystroke would make typing
  // in a 400-row Autocomplete visibly laggy.
  const offsets = useMemo(
    () => new Map(zones.map((zone): [string, string] => [zone, offsetLabel(zone)])),
    [zones],
  );

  async function choose(zone: string | null): Promise<void> {
    if (zone === null || zone === timezone) {
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      // The main process pushes the new state, which re-renders this whole app in the new
      // zone — including the `timezone` prop above. We never set it locally.
      await window.tracker.setTimezone(zone);
    } catch (cause: unknown) {
      console.error('Failed to save the timezone', cause);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={1.25}>
      <Autocomplete
        value={timezone}
        options={zones}
        disabled={saving}
        disableClearable
        autoHighlight
        onChange={(_event, zone) => {
          choose(zone).catch((cause: unknown) => console.error('Timezone change failed', cause));
        }}
        isOptionEqualToValue={(option, value) => option === value}
        renderOption={(props, zone) => {
          const { key, ...liProps } = props as OptionProps;
          return (
            <Box
              component="li"
              key={key}
              {...liProps}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
            >
              <Typography variant="body2" noWrap>
                {zone}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: 'text.secondary',
                }}
              >
                {offsets.get(zone)}
              </Typography>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('Timezone')}
            fullWidth
            helperText={t('Every date and time in this app is shown in this zone ({offset}).', {
              offset: offsetLabel(timezone),
            })}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {saving ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {t('It is {time} there right now.', {
          time: formatTimeOfDay(new Date().toISOString(), timezone),
        })}
      </Typography>

      {failed ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {t(SAVE_FAILED)}
        </Alert>
      ) : null}
    </Stack>
  );
}
