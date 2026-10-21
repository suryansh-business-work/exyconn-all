import { Grid } from '@exyconn/shell/components/ui';
import {
  RhfDatePicker,
  RhfSelect,
  RhfTextField,
  RhfCurrencyField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { RecurrenceFrequency } from '@exyconn/shell/graphql/generated';

const HALF = { xs: 12, sm: 6 };

interface RecurringScheduleFieldsProps {
  gstStateOptions: SelectOption[];
}

/** How often the retainer bills, in what money, from when to when, and on what terms. */
export function RecurringScheduleFields({
  gstStateOptions,
}: Readonly<RecurringScheduleFieldsProps>) {
  return (
    <Grid container spacing={2}>
      <Grid size={HALF}>
        <RhfSelect
          name="frequency"
          label="Bills every"
          options={enumOptions(Object.values(RecurrenceFrequency))}
          helperText="How often a new invoice is raised: weekly, monthly, quarterly or yearly."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfCurrencyField helperText="The currency every invoice from this retainer is raised in." />
      </Grid>
      <Grid size={HALF}>
        <RhfDatePicker
          name="startDate"
          label="First invoice on"
          helperText="The issue date of the first invoice; later ones follow the frequency."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfDatePicker
          name="endDate"
          label="Stop after (optional)"
          helperText="Optional. No invoices are raised after this day; leave empty to run until paused."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfTextField
          name="dueDays"
          label="Payment terms (days)"
          type="number"
          helperText="Days between an invoice's issue date and its due date."
        />
      </Grid>
      <Grid size={HALF}>
        <RhfSelect
          name="placeOfSupplyStateCode"
          label="Place of supply"
          options={gstStateOptions}
          helperText="Optional. The client's GST state. Same as ours: CGST + SGST; otherwise IGST."
        />
      </Grid>
    </Grid>
  );
}
