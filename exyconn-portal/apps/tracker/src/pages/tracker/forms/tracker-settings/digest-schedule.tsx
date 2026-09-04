import { useFormContext } from 'react-hook-form';
import { Box, FormHelperText, Grid } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';

/**
 * The scheduled summary emails.
 *
 * They go to everyone holding the Tracker role rather than to a list kept here — the people
 * who administer the tracker are already a known set, and a second list of addresses would
 * drift out of date the first time somebody changed job.
 */
export function DigestScheduleFields() {
  const { watch } = useFormContext<{
    dailyDigestEnabled: boolean;
    weeklyDigestEnabled: boolean;
  }>();
  const anyDigestOn = watch('dailyDigestEnabled') || watch('weeklyDigestEnabled');

  return (
    <Box>
      <RhfSwitch name="dailyDigestEnabled" label="Email a daily summary" />
      <RhfSwitch name="weeklyDigestEnabled" label="Email a weekly summary (Mondays)" />
      <FormHelperText>
        Sent to everyone with the Tracker role: hours per employee for the period, tracked and
        off-computer shown separately.
      </FormHelperText>
      {anyDigestOn ? (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <RhfTextField
              name="digestHour"
              label="Send at (hour, 0–23)"
              type="number"
              helperText="Read in the workspace timezone, not UTC."
            />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}
