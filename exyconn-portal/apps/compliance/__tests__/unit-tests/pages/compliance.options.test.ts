import { describe, expect, it } from 'vitest';
import {
  ComplianceCategory,
  ManagementStandard,
  RiskStatus,
  RiskTreatment,
} from '@exyconn/shell/graphql/generated';
import {
  CATEGORY_OPTIONS,
  RISK_SCALE_OPTIONS,
  RISK_STATUS_OPTIONS,
  RISK_TREATMENT_OPTIONS,
  STANDARD_OPTIONS,
} from '../../../src/pages/compliance.options';

describe('compliance options', () => {
  it('writes each standard as "ISO 27001", not the title-cased "Iso 27001"', () => {
    expect(STANDARD_OPTIONS).toEqual(
      Object.values(ManagementStandard).map((value) => ({
        value,
        label: value.replace('_', ' '),
      })),
    );
    expect(STANDARD_OPTIONS).toContainEqual({ value: 'ISO_27001', label: 'ISO 27001' });
  });

  it('offers every category, status and treatment the schema knows, title-cased', () => {
    expect(CATEGORY_OPTIONS.map((option) => option.value)).toEqual(
      Object.values(ComplianceCategory),
    );
    expect(CATEGORY_OPTIONS).toContainEqual({ value: 'HEALTH_SAFETY', label: 'Health Safety' });
    expect(RISK_STATUS_OPTIONS.map((option) => option.value)).toEqual(Object.values(RiskStatus));
    expect(RISK_TREATMENT_OPTIONS.map((option) => option.value)).toEqual(
      Object.values(RiskTreatment),
    );
    expect(RISK_TREATMENT_OPTIONS).toContainEqual({ value: 'REDUCE', label: 'Reduce' });
  });

  it('scores both risk axes 1 to 5, as strings, each with its word', () => {
    expect(RISK_SCALE_OPTIONS.map((option) => option.value)).toEqual(['1', '2', '3', '4', '5']);
    expect(RISK_SCALE_OPTIONS[0].label).toBe('1 — Very low');
    expect(RISK_SCALE_OPTIONS[4].label).toBe('5 — Very high');
  });
});
