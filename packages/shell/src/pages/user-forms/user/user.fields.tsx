import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  RhfAutocomplete,
  RhfImageField,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@/components/form/rhf';
import { enumOptions } from '@/utils/enumOptions';
import { EmploymentStatus, WorkingTime, WorkLocation } from '@/graphql/generated';
import { DEFAULT_WORK_HOURS } from '@/components/work';
import { LocalePreferenceFields } from '@/components/localization';
import { PlaceOfEmploymentFields } from './user.place-fields';
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

/** Just enough of a position to offer it as a designation. */
interface PositionOption {
  name: string;
  department: string;
  active: boolean;
}

interface EmploymentFieldsProps {
  departmentOptions: SelectOption[];
  positions: ReadonlyArray<PositionOption>;
  /** The saved designation, kept selectable even if its position was closed or moved. */
  currentDesignation?: string | null;
  managerOptions: SelectOption[];
}

/** The open positions of one department, plus the employee's saved designation. */
function designationOptions(
  positions: ReadonlyArray<PositionOption>,
  department: string,
  current?: string | null,
): SelectOption[] {
  const names = positions
    .filter((position) => position.department === department && position.active)
    .map((position) => position.name);
  const unique = Array.from(new Set([...names, ...(current ? [current] : [])]));
  return unique.map((value) => ({ value, label: value }));
}

/**
 * A designation belongs to its department, so switching department clears one that the new
 * department does not have. The first render is skipped: a saved record keeps what it has.
 */
function useClearDesignationOnDepartmentChange(positions: ReadonlyArray<PositionOption>) {
  const { watch, getValues, setValue } = useFormContext<UserValues>();
  const department = watch('department');
  const previous = useRef(department);
  useEffect(() => {
    if (previous.current === department) return;
    previous.current = department;
    const designation = getValues('designation');
    const held = positions.some((p) => p.department === department && p.name === designation);
    if (!held) setValue('designation', '');
  }, [department, positions, getValues, setValue]);
  return department;
}

/** Where the employee sits in the organisation, who they report to, and since when. */
export function EmploymentFields({
  departmentOptions,
  positions,
  currentDesignation,
  managerOptions,
}: Readonly<EmploymentFieldsProps>) {
  const department = useClearDesignationOnDepartmentChange(positions);
  const positionOptions = designationOptions(positions, department, currentDesignation);
  const designationHint = department
    ? 'Add positions to this department in HR → Departments.'
    : 'Choose a department first.';
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
        helperText={positionOptions.length ? undefined : designationHint}
      />
      <RhfAutocomplete
        name="managerId"
        label="Reports to (manager)"
        options={managerOptions}
        helperText="Places them under this manager in the org chart. Their manager may approve leave and requests, and writes their appraisal."
      />
      <RhfSelect
        name="employmentStatus"
        label="Employment status"
        options={EMPLOYMENT_STATUS_OPTIONS}
      />
      <PlaceOfEmploymentFields />
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
        helperText={`Hours in a working day. Defaults to ${DEFAULT_WORK_HOURS} — the desktop tracker shows progress against this.`}
        slotProps={{
          htmlInput: { min: 1, max: 24, step: 0.5 },
        }}
      />
      {/* Where they actually are, which is what every date, time and deadline is read in.
          Asked here rather than left to the person: an employee hired into another country
          should not spend their first day reading the office's clock. */}
      <LocalePreferenceFields />
    </>
  );
}
