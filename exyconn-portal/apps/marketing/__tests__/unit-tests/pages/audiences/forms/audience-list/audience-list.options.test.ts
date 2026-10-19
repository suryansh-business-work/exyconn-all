import { describe, expect, it } from 'vitest';
import {
  AudienceCompanyEmailSource,
  AudienceEmailSelection,
  AudienceRecipientSource,
  AudienceRuleOperator,
  AudienceUpdateMode,
} from '@exyconn/shell/graphql/generated';
import {
  COMPANY_EMAIL_OPTIONS,
  EMAIL_SELECTION_OPTIONS,
  OPERATOR_LABELS,
  RECIPIENT_SOURCE_OPTIONS,
  UPDATE_MODE_OPTIONS,
} from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.options';

const values = (options: ReadonlyArray<{ value: string }>) => options.map((o) => o.value);
const recommended = (options: ReadonlyArray<{ value: string; recommended?: boolean }>) =>
  options.filter((option) => option.recommended).map((option) => option.value);

describe('audience builder options', () => {
  it('offers every choice the API accepts, each once', () => {
    expect(values(RECIPIENT_SOURCE_OPTIONS).toSorted((a, b) => a.localeCompare(b))).toEqual(
      Object.values(AudienceRecipientSource).toSorted((a, b) => a.localeCompare(b)),
    );
    expect(values(COMPANY_EMAIL_OPTIONS).toSorted((a, b) => a.localeCompare(b))).toEqual(
      Object.values(AudienceCompanyEmailSource).toSorted((a, b) => a.localeCompare(b)),
    );
    expect(values(EMAIL_SELECTION_OPTIONS).toSorted((a, b) => a.localeCompare(b))).toEqual(
      Object.values(AudienceEmailSelection).toSorted((a, b) => a.localeCompare(b)),
    );
    expect(values(UPDATE_MODE_OPTIONS).toSorted((a, b) => a.localeCompare(b))).toEqual(
      Object.values(AudienceUpdateMode).toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('recommends exactly the defaults a new audience starts from', () => {
    expect(recommended(COMPANY_EMAIL_OPTIONS)).toEqual([AudienceCompanyEmailSource.Both]);
    expect(recommended(EMAIL_SELECTION_OPTIONS)).toEqual([AudienceEmailSelection.Primary]);
    expect(recommended(UPDATE_MODE_OPTIONS)).toEqual([AudienceUpdateMode.Dynamic]);
  });

  it('words every comparison operator', () => {
    for (const operator of Object.values(AudienceRuleOperator)) {
      expect(OPERATOR_LABELS[operator]).toMatch(/\S/);
    }
    expect(OPERATOR_LABELS[AudienceRuleOperator.WithinDays]).toBe('within the last (days)');
  });
});
