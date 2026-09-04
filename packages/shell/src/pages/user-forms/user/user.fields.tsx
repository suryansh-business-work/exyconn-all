import { useFormContext } from 'react-hook-form';
import { RhfImageField, RhfSelect, RhfTextField, type SelectOption } from '@/components/form/rhf';
import { enumOptions } from '@/utils/enumOptions';
import { EmploymentStatus, WorkingTime, WorkLocation } from '@/graphql/generated';
import { DEFAULT_WORK_HOURS } from '@/components/work';
import type { UserValues } from './user.schema';

const WORKING_TIME_OPTIONS = enumOptions(Object.values(WorkingTime));
const WORK_LOCATION_OPTIONS = enumOptions(Object.values(WorkLocation));
const EMPLOYMENT_STATUS_OPTIONS = enumOptions(Object.values(EmploymentStatus));

/** Photo, address and a short brief — the parts of the record that describe the person. */
export function ProfileFields() {
  return (
    <>
      <RhfImageField
        name="avatarUrl"
        label="Photo"
        folder="employees"
        helperText="Shown on their profile, in the directory and in the desktop tracker."
      />
      <RhfTextField
        name="address"
        label="Address"
        multiline
        minRows={2}
        helperText="Postal address, as given on the employment record."
      />
      <RhfTextField
        name="brief"
        label="Brief"
        multiline
        minRows={3}
        helperText="A few lines about the person — what they do, and who they work with."
      />
    </>
  );
}

interface EmploymentFieldsProps {
  departmentOptions: SelectOption[];
  positionOptions: SelectOption[];
}

/** Where the employee sits in the organisation, and since when. */
export function EmploymentFields({
  departmentOptions,
  positionOptions,
}: Readonly<EmploymentFieldsProps>) {
  return (
    <>
      <RhfSelect
        name="department"
        label="Department"
        options={departmentOptions}
        helperText={
          departmentOptions.length ? undefined : 'Add departments in HR → Departments first.'
        }
      />
      <RhfSelect
        name="designation"
        label="Designation"
        options={positionOptions}
        helperText={positionOptions.length ? undefined : 'Add positions in HR → Positions first.'}
      />
      <RhfSelect
        name="employmentStatus"
        label="Employment status"
        options={EMPLOYMENT_STATUS_OPTIONS}
      />
    </>
  );
}

/**
 * When, from where, and for how long a day the employee works.
 *
 * Hours are asked for in EVERY arrangement, not only the fixed one: a flexible day moves the
 * clock time, not the length of the day, and the tracker measures the day against this number
 * whichever arrangement it is. The two "Other" notes only appear once "Other" is chosen —
 * an empty note next to a named arrangement is noise.
 */
export function WorkArrangementFields() {
  const { watch } = useFormContext<UserValues>();
  const workingTime = watch('workingTime');
  const workLocation = watch('workLocation');

  return (
    <>
      <RhfSelect name="workingTime" label="Working time" options={WORKING_TIME_OPTIONS} />
      {workingTime === WorkingTime.Other && (
        <RhfTextField
          name="workingTimeNote"
          label="Working-time arrangement"
          helperText="Describe the arrangement, e.g. “Four days, Mon–Thu”."
        />
      )}
      <RhfSelect name="workLocation" label="Work location" options={WORK_LOCATION_OPTIONS} />
      {workLocation === WorkLocation.Other && (
        <RhfTextField
          name="workLocationNote"
          label="Work location detail"
          helperText="Describe where they work from, e.g. “Client site, Pune”."
        />
      )}
      <RhfTextField
        name="workHoursPerDay"
        label="Working hours per day"
        type="number"
        inputProps={{ min: 1, max: 24, step: 0.5 }}
        helperText={`Hours in a working day. Defaults to ${DEFAULT_WORK_HOURS} — the desktop tracker shows progress against this.`}
      />
    </>
  );
}
