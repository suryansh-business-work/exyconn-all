import { useT } from '@exyconn/i18n';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EFFECTIVE_NO, EFFECTIVE_UNANSWERED, EFFECTIVE_YES } from './finding.schema';

/** Not a checkbox: "nobody has checked yet" is a different answer from "it did not work". */
const EFFECTIVE_OPTIONS: SelectOption[] = [
  { value: EFFECTIVE_UNANSWERED, label: 'Not checked yet' },
  { value: EFFECTIVE_YES, label: 'Yes — it worked' },
  { value: EFFECTIVE_NO, label: 'No — it did not' },
];

/** Whether the corrective action was checked and whether it worked (clause 10.2). */
export function FindingVerificationFields() {
  const t = useT();
  return (
    <>
      <RhfDatePicker
        name="verifiedOn"
        label="Verified on"
        helperText="When someone checked the corrective action worked. Required to close."
      />
      <RhfTextField
        name="verifiedByName"
        label="Verified by"
        helperText="Optional. The person who checked the corrective action."
      />
      <RhfSelect
        name="effective"
        label="Was it effective?"
        options={EFFECTIVE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        helperText="Whether the corrective action stopped the problem. Required to close."
      />
      <RhfTextField
        name="effectivenessNote"
        label="What the verification showed"
        multiline
        rows={2}
        helperText="Optional. The evidence that the action did or did not work."
      />
    </>
  );
}
