import { RhfAutocomplete, type SelectOption } from '@/components/form/rhf';
import { useOrgMasterOptionsQuery } from '@/graphql/generated';

/** "Not placed yet", which is the honest state for most of a joiner's first week. */
const UNSET: SelectOption = { value: '', label: 'Not set' };

/** A master keyed on a code — a location, a grade, an employment type. */
interface CodedRow {
  name: string;
  code: string;
  active: boolean;
}

/** Only what is still in use: a retired master should not be offered for a new placement. */
function codeOptions(rows: readonly CodedRow[] | undefined): SelectOption[] {
  return [
    UNSET,
    ...(rows ?? [])
      .filter((row) => row.active)
      .map((row) => ({ value: row.code, label: `${row.name} (${row.code})` })),
  ];
}

/** Teams have no code of their own, so they are placed by name. */
function teamOptions(
  rows: readonly { name: string; department: string; active: boolean }[] | undefined,
): SelectOption[] {
  return [
    UNSET,
    ...(rows ?? [])
      .filter((row) => row.active)
      .map((row) => ({
        value: row.name,
        label: row.department ? `${row.name} · ${row.department}` : row.name,
      })),
  ];
}

/** A shift reads as its hours, because that is what somebody is choosing between. */
function shiftOptions(
  rows: readonly (CodedRow & { startTime: string; endTime: string })[] | undefined,
): SelectOption[] {
  return [
    UNSET,
    ...(rows ?? [])
      .filter((row) => row.active)
      .map((row) => ({
        value: row.code,
        label: `${row.name} (${row.startTime}–${row.endTime})`,
      })),
  ];
}

/**
 * Where this person sits in the org: location, team, grade, employment type and shift.
 *
 * All five masters were full CRUD screens with nothing on either side of them — an employee
 * could not be put at a location or on a shift, so a location's timezone and a shift's grace
 * period were configured and then read by nothing. These are the pickers that connect them,
 * and every option comes from the master list rather than being typed again.
 */
export function PlacementFields() {
  const { data } = useOrgMasterOptionsQuery({ fetchPolicy: 'cache-first' });

  return (
    <>
      <RhfAutocomplete
        name="locationCode"
        label="Location"
        options={codeOptions(data?.listLocations)}
        helperText="The office or site they work at. Set up under Locations."
      />
      <RhfAutocomplete
        name="teamName"
        label="Team"
        options={teamOptions(data?.listTeams)}
        helperText="The team inside their department. Set up under Teams."
      />
      <RhfAutocomplete
        name="gradeCode"
        label="Grade"
        options={codeOptions(data?.listGrades)}
        helperText="Their band, which decides the salary range. Set up under Grades."
      />
      <RhfAutocomplete
        name="employmentTypeCode"
        label="Employment type"
        options={codeOptions(data?.listEmploymentTypes)}
        helperText="Permanent, contract, intern — and whether payroll includes them."
      />
      <RhfAutocomplete
        name="shiftCode"
        label="Shift"
        options={shiftOptions(data?.listShifts)}
        helperText="The hours they are expected to keep. Set up under Shifts."
      />
    </>
  );
}
