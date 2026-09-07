import { ApplicantSource, ApplicantStage } from '@exyconn/shell/graphql/generated';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

/** Pipeline order, as the server declares it. */
export const APPLICANT_STAGES = Object.values(ApplicantStage);
export const APPLICANT_SOURCES = Object.values(ApplicantSource);

export const STAGE_OPTIONS = enumOptions(APPLICANT_STAGES);
export const SOURCE_OPTIONS = enumOptions(APPLICANT_SOURCES);

/** 0 is "not rated"; the form offers it so a rating can be cleared. */
export const RATING_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Not rated' },
  { value: '1', label: '1 — Weak' },
  { value: '2', label: '2 — Below the bar' },
  { value: '3', label: '3 — Meets the bar' },
  { value: '4', label: '4 — Strong' },
  { value: '5', label: '5 — Exceptional' },
];

/** Stat tile accents, one per stage the tiles show. */
export const STAGE_ACCENTS: Record<ApplicantStage, string> = {
  [ApplicantStage.New]: '#4f8cff',
  [ApplicantStage.Screening]: '#ffd166',
  [ApplicantStage.Interview]: '#8b5cf6',
  [ApplicantStage.Offer]: '#f9851f',
  [ApplicantStage.Hired]: '#7be37b',
  [ApplicantStage.Rejected]: '#ff6b6b',
};
