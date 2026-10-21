import { RhfDatePicker, RhfSelect, type SelectOption } from '@/components/form/rhf';

const ACTIVE_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

/** When the employee joined, was born and comes off probation. */
export function EmploymentDateFields() {
  return (
    <>
      <RhfDatePicker
        name="joinDate"
        label="Join date"
        helperText="Their first working day with the company."
      />
      <RhfDatePicker
        name="dateOfBirth"
        label="Date of birth (optional)"
        helperText="Optional. Kept on their employee record for HR."
      />
      <RhfDatePicker
        name="probationEndDate"
        label="Probation ends (optional)"
        helperText="Optional. Leave empty if they are not on probation."
      />
    </>
  );
}

/** Whether the account may sign in at all. */
export function AccountAccessField() {
  return (
    <RhfSelect
      name="isActive"
      label="Account access"
      options={ACTIVE_OPTIONS}
      helperText="An inactive account cannot sign in to the portals or the tracker."
    />
  );
}
