import { describe, expect, it } from 'vitest';
import { ApplicantSource, ApplicantStage } from '@exyconn/shell/graphql/generated';
import {
  APPLICANT_SOURCES,
  APPLICANT_STAGES,
  RATING_OPTIONS,
  SOURCE_OPTIONS,
  STAGE_ACCENTS,
  STAGE_OPTIONS,
} from '../../../../src/pages/applicants/applicants.constants';

describe('applicants constants', () => {
  it('lists every stage and source the server knows', () => {
    expect(new Set(APPLICANT_STAGES)).toEqual(new Set(Object.values(ApplicantStage)));
    expect(APPLICANT_SOURCES).toHaveLength(Object.values(ApplicantSource).length);
  });

  it('labels the stage and source options in title case', () => {
    expect(STAGE_OPTIONS).toContainEqual({ value: 'SCREENING', label: 'Screening' });
    expect(SOURCE_OPTIONS).toContainEqual({ value: 'REFERRAL', label: 'Referral' });
  });

  it('rates from "not rated" up to five, as strings the select can hold', () => {
    expect(RATING_OPTIONS.map((option) => option.value)).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(RATING_OPTIONS[0].label).toBe('Not rated');
  });

  it('gives every stage a tile accent', () => {
    for (const stage of Object.values(ApplicantStage)) {
      expect(STAGE_ACCENTS[stage]).toEqual(expect.any(String));
    }
  });
});
