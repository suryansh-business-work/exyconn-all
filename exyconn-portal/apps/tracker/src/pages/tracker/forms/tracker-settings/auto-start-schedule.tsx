import { useFormContext } from 'react-hook-form';
import { Box, FormHelperText, Grid } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';

/**
 * Tracking on a schedule instead of on a button press.
 *
 * The window is read on each EMPLOYEE's own clock, not the server's, so one setting works
 * for a team spread across timezones. Stopping early still wins: the desktop app will not
 * restart a session the employee ended until the window comes round again.
 */
export function AutoStartScheduleFields() {
  const { watch } = useFormContext<{
    autoStartEnabled: boolean;
    autoStartHour: number;
    autoStopHour: number;
  }>();
  const enabled = watch('autoStartEnabled');
  const startHour = Number(watch('autoStartHour'));
  const stopHour = Number(watch('autoStopHour'));
  const crossesMidnight = enabled && stopHour <= startHour;

  return (
    <Box>
      <RhfSwitch name="autoStartEnabled" label="Start tracking automatically" />
      <FormHelperText>
        The desktop app starts and stops itself inside this window instead of waiting for the
        employee to press start. They can still stop early, and it will not restart them.
      </FormHelperText>
      {enabled ? (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <RhfTextField name="autoStartHour" label="Start at (hour, 0–23)" type="number" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <RhfTextField
              name="autoStopHour"
              label="Stop at (hour, 0–23)"
              type="number"
              helperText={
                crossesMidnight
                  ? 'This window runs past midnight — a night shift.'
                  : "Read on each employee's own clock."
              }
            />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}
