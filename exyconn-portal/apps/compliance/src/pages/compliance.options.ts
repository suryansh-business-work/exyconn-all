import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ComplianceCategory,
  ManagementStandard,
  RiskStatus,
  RiskTreatment,
} from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

/**
 * The options every compliance screen shares.
 *
 * Built from the generated enums rather than typed out, so a value added to the schema shows
 * up in the pickers without anybody remembering to add it in two places.
 */
export const STANDARD_OPTIONS: SelectOption[] = Object.values(ManagementStandard).map((value) => ({
  value,
  // "ISO_27001" reads as "ISO 27001"; the generic title-caser would give "Iso 27001".
  label: value.replace('_', ' '),
}));

export const CATEGORY_OPTIONS = enumOptions(Object.values(ComplianceCategory));
export const RISK_STATUS_OPTIONS = enumOptions(Object.values(RiskStatus));
export const RISK_TREATMENT_OPTIONS = enumOptions(Object.values(RiskTreatment));

/** Both risk axes are scored 1-5, which is what makes a rating run 1-25. */
export const RISK_SCALE_OPTIONS: SelectOption[] = [
  { value: '1', label: '1 — Very low' },
  { value: '2', label: '2 — Low' },
  { value: '3', label: '3 — Medium' },
  { value: '4', label: '4 — High' },
  { value: '5', label: '5 — Very high' },
];
