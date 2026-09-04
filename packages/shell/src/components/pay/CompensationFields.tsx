import { useFormContext } from 'react-hook-form';
import { Grid, Typography } from '@/components/ui';
import { RhfDatePicker, RhfSelect, RhfTextField } from '@/components/form/rhf';
import { enumOptions } from '@/utils/enumOptions';
import { PayType } from '@/graphql/generated';
import { rateLabel, usesSingleAmount, type CompensationValues } from './compensation';

const PAY_TYPE_OPTIONS = enumOptions(Object.values(PayType));

/** A money input. Half-width on anything but a phone, so the components read as a group. */
function Money({ name, label, help }: Readonly<{ name: string; label: string; help?: string }>) {
  return (
    <Grid item xs={12} sm={6}>
      <RhfTextField
        name={name}
        label={label}
        type="number"
        inputProps={{ min: 0, step: 'any' }}
        helperText={help}
      />
    </Grid>
  );
}

/** The monthly components a FIXED salary is built from — what payroll pays out each month. */
function FixedAmounts() {
  return (
    <>
      <Money name="basic" label="Basic" help="Loss of pay for unpaid leave is prorated on this." />
      <Money name="hra" label="HRA" />
      <Money name="allowances" label="Allowances" />
    </>
  );
}

/**
 * How this employee is paid, and what their time is billed at.
 *
 * The pay type decides which amounts are asked for, because asking for all of them would
 * invite a stipend that also carries a basic salary — a number payroll would pay out. The
 * billing rate is asked for whatever the type: it is what the tracker prices tracked hours
 * at, and pay and bill-out are different numbers even for an hourly employee.
 */
export function CompensationFields() {
  const { watch } = useFormContext<CompensationValues>();
  const payType = watch('payType');
  const single = usesSingleAmount(payType);

  return (
    <>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        Compensation
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <RhfSelect name="payType" label="Pay type" options={PAY_TYPE_OPTIONS} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField name="currency" label="Currency" />
        </Grid>

        {payType === PayType.Other && (
          <Grid item xs={12}>
            <RhfTextField
              name="payTypeNote"
              label="Pay arrangement"
              helperText="Describe how this person is paid, e.g. “Per delivered milestone”."
            />
          </Grid>
        )}

        {single ? <Money name="rate" label={rateLabel(payType)} /> : <FixedAmounts />}

        <Money name="deductions" label="Deductions" />
        <Money
          name="billingRate"
          label="Billing rate per hour"
          help="What the tracker bills an hour of this person's time at. Leave 0 if their time is not billed."
        />
        <Grid item xs={12} sm={6}>
          <RhfDatePicker name="effectiveFrom" label="Effective from" />
        </Grid>
      </Grid>
    </>
  );
}
