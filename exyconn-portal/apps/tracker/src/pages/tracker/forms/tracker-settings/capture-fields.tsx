import { Grid } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

/** Two to a row on a desk, one on a phone — the shape every pair of these fields takes. */
const HALF = { xs: 12, sm: 6 } as const;

/**
 * How often the tracker looks, how much it keeps, and how often it uploads — the numbers
 * behind every capture. Split out from the form itself, which is otherwise a list of
 * switches and the four field groups below it.
 */
export function CaptureFields() {
  return (
    <Grid container spacing={2}>
      <Grid size={HALF}>
        <RhfTextField name="intervalMinutes" label="Interval (minutes)" type="number" />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField name="screenshotsPerInterval" label="Screenshots / interval" type="number" />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField name="idleThresholdSeconds" label="Idle threshold (s)" type="number" />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField
          name="idleAutoPauseMinutes"
          label="Pause after idle (minutes)"
          type="number"
          helperText="The desktop app pauses itself after this much unbroken idle time. 0 never pauses."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField name="screenshotMaxWidth" label="Screenshot max width" type="number" />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField
          name="screenshotQuality"
          label="Screenshot quality (%)"
          type="number"
          helperText="100 = native resolution, lossless. Below 100 downscales to the max width."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField
          name="screenshotRetentionDays"
          label="Delete screenshots after (days)"
          type="number"
          helperText="0 keeps them forever. Any other value deletes the image and its record once it is that old — permanently, and on a schedule."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField
          name="syncIntervalMinutes"
          label="Auto-sync every (minutes)"
          type="number"
          helperText="How often the desktop app uploads queued activity and screenshots. Syncing is always automatic."
        />
      </Grid>
    </Grid>
  );
}
