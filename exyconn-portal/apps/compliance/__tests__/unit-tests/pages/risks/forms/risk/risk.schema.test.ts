import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComplianceCategory, RiskStatus, RiskTreatment } from '@exyconn/shell/graphql/generated';
import {
  ratingHint,
  riskLevel,
  riskSchema,
  toRiskInput,
  toRiskValues,
} from '../../../../../../src/pages/risks/forms/risk';
import { riskRow } from '../../../compliance.fixtures';

const messages = (values: unknown) =>
  riskSchema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];

describe('riskLevel and ratingHint', () => {
  it('bands a 1-25 score in the four steps the server uses', () => {
    expect([1, 4, 5, 9, 10, 14, 15, 25].map(riskLevel)).toEqual([
      'Low',
      'Low',
      'Medium',
      'Medium',
      'High',
      'High',
      'Critical',
      'Critical',
    ]);
  });

  it('multiplies the two axes and names the band', () => {
    expect(ratingHint('Inherent', '3', '5')).toBe('Inherent rating 15 — Critical');
    expect(ratingHint('Residual', '1', '2')).toBe('Residual rating 2 — Low');
  });

  it('asks for both axes while either is missing', () => {
    expect(ratingHint('Inherent', undefined, '4')).toBe('Inherent rating: pick both axes');
    expect(ratingHint('Residual', '2', undefined)).toBe('Residual rating: pick both axes');
  });
});

describe('toRiskValues', () => {
  afterEach(() => vi.useRealTimers());

  it('starts a new risk on safe defaults, identified today', () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T09:00:00.000Z') });
    expect(toRiskValues(null)).toEqual({
      title: '',
      description: '',
      standards: [],
      category: ComplianceCategory.Operational,
      subject: '',
      ownerId: '',
      ownerName: '',
      likelihood: '3',
      impact: '3',
      treatment: RiskTreatment.Reduce,
      controls: '',
      residualLikelihood: '2',
      residualImpact: '2',
      status: RiskStatus.Identified,
      identifiedOn: new Date('2026-10-07T09:00:00.000Z'),
      reviewDueOn: null,
    });
  });

  it('loads a saved risk, its scores as the strings the pickers hold', () => {
    const values = toRiskValues(riskRow());
    expect(values).toMatchObject({ title: 'Laptop theft', likelihood: '4', impact: '5' });
    expect(values.residualLikelihood).toBe('1');
    expect(values.identifiedOn).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(values.reviewDueOn).toEqual(new Date('2026-12-01T00:00:00.000Z'));
    expect(toRiskValues(riskRow({ reviewDueOn: null })).reviewDueOn).toBeNull();
  });
});

describe('riskSchema', () => {
  it('accepts a saved risk as it loads', () => {
    expect(riskSchema.safeParse(toRiskValues(riskRow())).success).toBe(true);
  });

  it('asks what the risk is, who owns it and which standard it answers to', () => {
    expect(messages(toRiskValues(null))).toEqual([
      'Say what the risk is',
      'Pick at least one standard',
      'A risk with no owner is a note, not a risk',
    ]);
  });

  it('scores each axis 1 to 5 only', () => {
    const values = { ...toRiskValues(riskRow()), likelihood: '0', residualImpact: '6' };
    expect(messages(values)).toEqual([
      'Likelihood is scored 1 to 5',
      'Residual impact is scored 1 to 5',
    ]);
  });

  it('takes the dates the picker writes back, and a cleared review date', () => {
    const parsed = riskSchema.parse({
      ...toRiskValues(riskRow()),
      identifiedOn: '2026-04-15T00:00:00.000Z',
      reviewDueOn: '',
    });
    expect(parsed.identifiedOn).toEqual(new Date('2026-04-15T00:00:00.000Z'));
    expect(parsed.reviewDueOn).toBeNull();
    expect(messages({ ...toRiskValues(riskRow()), identifiedOn: '' })).toEqual([
      'Say when it was identified',
    ]);
  });
});

describe('toRiskInput', () => {
  it('sends the scores back as numbers and the dates as ISO strings', () => {
    const input = toRiskInput(riskSchema.parse(toRiskValues(riskRow())));
    expect(input).toMatchObject({
      likelihood: 4,
      impact: 5,
      residualLikelihood: 1,
      residualImpact: 3,
      identifiedOn: '2026-09-01T00:00:00.000Z',
      reviewDueOn: '2026-12-01T00:00:00.000Z',
    });
    expect(
      toRiskInput({ ...riskSchema.parse(toRiskValues(riskRow())), reviewDueOn: null }),
    ).toHaveProperty('reviewDueOn', null);
  });
});
