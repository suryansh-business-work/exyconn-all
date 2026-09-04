import type { ReactElement } from 'react';
import { useMemo, useState, type HTMLAttributes } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@exyconn/ui';
import { formatTimeOfDay, offsetLabel, timezoneNames } from '../time';

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
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const zones = useMemo(() => timezoneNames(timezone), [timezone]);
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
              <Typography variant="caption" color="text.secondary" noWrap>
                {offsets.get(zone)}
              </Typography>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Timezone"
            fullWidth
            helperText={`Every date and time in this app is shown in this zone (${offsetLabel(timezone)}).`}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {saving ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      <Typography variant="caption" color="text.secondary">
        It is {formatTimeOfDay(new Date().toISOString(), timezone)} there right now.
      </Typography>

      {failed ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px' }}>
          {SAVE_FAILED}
        </Alert>
      ) : null}
    </Stack>
  );
}
